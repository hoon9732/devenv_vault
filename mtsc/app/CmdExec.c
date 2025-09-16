#define DEBUG_MSG

#include <vxworks.h>
#include <symLib.h>
#include <errnoLib.h>
#include <usrLib.h>
#include <string.h>
#include <ctype.h>

#include "../lib/util/isDebug.h"
#include "common.h"
#include "CmdExec.h"
#include "CmdFuncs.h"
#include "UdpSendOps.h"

#define CMD_EXEC_MSG_Q_LEN	(20)
#define CMD_TBL_POOL_SIZE	(4096)
#define CMD_TBL_ITEM(x)		{ #x, x }

typedef enum {
	RUNNING,
	STOP
} CmdExecState;

typedef struct {
	TASK_ID			taskId;
	ModuleType		ipcType;
	union {
		MSG_Q_ID	msgQId;
		int			pipeFd;
		int			quitFlag;
	} ipcObj;
	char			deferredWorkName[32];
#ifdef USE_CHK_TASK_STATUS
	TaskStatus *	taskStatus;
#endif
	CmdExecState 	state;
	PART_ID			cmdPoolId;
	SYMTAB_ID		cmdTblId;
	TASK_ID			tidCmdExec;
} CmdExecInst;

typedef struct tagCmdTblItem {
	char *	name;
	FUNCPTR pfn;
} CMD_TBL_ITEM;

LOCAL CmdExecInst g_stCmdExecInst = {
	TASK_ID_ERROR, MSGQ, {MSG_Q_ID_NULL}, "",
};

LOCAL char g_cmdTblPool[CMD_TBL_POOL_SIZE];

LOCAL CMD_TBL_ITEM g_cmdTblItems[] = {
	CMD_TBL_ITEM(mtsTestFunc),
	CMD_TBL_ITEM(invokeMethod_uint),
	CMD_TBL_ITEM(invokeMethod_uint_double),
	CMD_TBL_ITEM(checkResult_equal),
	CMD_TBL_ITEM(checkResult_range),
	CMD_TBL_ITEM(mtsCommTestTxReq),
	CMD_TBL_ITEM(mtsCommTest),
	
	CMD_TBL_ITEM(mtsReset),
	CMD_TBL_ITEM(mtsUpdate),
	
	CMD_TBL_ITEM(mtsPowerExtOn),
	CMD_TBL_ITEM(mtsPowerExtOff),
	CMD_TBL_ITEM(mtsPowerExtGd),
	CMD_TBL_ITEM(mtsPowerMeasureVolt),
	CMD_TBL_ITEM(mtsPowerMeasureCurrent),
	CMD_TBL_ITEM(mtsInitActPwrSuplOut),
	CMD_TBL_ITEM(mtsSetActPwrSuplOut),
	CMD_TBL_ITEM(mtsSetActPwrSuplOutBit),
	CMD_TBL_ITEM(mtsGetActPwrSuplOut),
	CMD_TBL_ITEM(mtsChkGf2),
	CMD_TBL_ITEM(mtsGcuMslStsChk),
	CMD_TBL_ITEM(mtsSwVerChk),
	CMD_TBL_ITEM(mtsGcuFireModeStart),
	CMD_TBL_ITEM(mtsNavCal),
	CMD_TBL_ITEM(mtsNavDataInput),
	CMD_TBL_ITEM(mtsSaveAlignData),
	CMD_TBL_ITEM(mtsChkGf3NavData),
	CMD_TBL_ITEM(mtsGcaStart),
	CMD_TBL_ITEM(mtsShaStart),
	CMD_TBL_ITEM(mtsGcaDone),
	CMD_TBL_ITEM(mtsGcuiMslGpsModeSet),
	CMD_TBL_ITEM(mtsMslGpsTrkStart),
	CMD_TBL_ITEM(mtsActMotorOn),
	CMD_TBL_ITEM(mtsAcuCtrlCommandSetErrorDeg),
	CMD_TBL_ITEM(mtsAcuSlewStart),
	CMD_TBL_ITEM(mtsAcuSlewEnd),
	CMD_TBL_ITEM(mtsAcuWingCommandSetErrorDeg),
	CMD_TBL_ITEM(mtsArm1OnOff),
	CMD_TBL_ITEM(mtsBit),
	CMD_TBL_ITEM(steBit),
	CMD_TBL_ITEM(mtsChkGf7),
	CMD_TBL_ITEM(mtsGcuLoad),
	CMD_TBL_ITEM(mtsGcuProgramMode),
	CMD_TBL_ITEM(mtsGcuProgramStart),
	CMD_TBL_ITEM(mtsGcuProgramEnd),
	CMD_TBL_ITEM(mtsGcuTestMode),
	CMD_TBL_ITEM(mtsImuOn),
	CMD_TBL_ITEM(mtsIntArmingOn),
	CMD_TBL_ITEM(mtsIntArmingOff),
	CMD_TBL_ITEM(mtsIntSync),
	CMD_TBL_ITEM(mtsLiftOffMslOn),
	CMD_TBL_ITEM(mtsLiftOffMslOff),
	CMD_TBL_ITEM(mtsLiftOffReady),
	CMD_TBL_ITEM(mtsLiftOffTestOn),
	CMD_TBL_ITEM(mtsLiftOffTestOff),
	CMD_TBL_ITEM(mtsPowerBatGd),
	CMD_TBL_ITEM(mtsPowerBatOn),
	CMD_TBL_ITEM(mtsPowerBatOnBit),
	CMD_TBL_ITEM(mtsPowerBatOff),
	CMD_TBL_ITEM(mtsRdcDataLoad),
	CMD_TBL_ITEM(mtsRdcDataMode),
	CMD_TBL_ITEM(mtsRdcDataStart),
	CMD_TBL_ITEM(mtsRdcDataEnd),
	CMD_TBL_ITEM(mtsRdcModeInput),
	CMD_TBL_ITEM(mtsFireModeOn),
	CMD_TBL_ITEM(mtsFireMOdeOff),
	CMD_TBL_ITEM(mtsNavChk1),
	CMD_TBL_ITEM(mtsNavChk2),
	CMD_TBL_ITEM(mtsNavChk3),
	CMD_TBL_ITEM(mtsChkGf12),
	CMD_TBL_ITEM(mtsSimHotStartLoad),
	CMD_TBL_ITEM(mtsSimHotStartStart),
	CMD_TBL_ITEM(mtsSimHotStartStop),
	CMD_TBL_ITEM(mtsLarModeSet),
	CMD_TBL_ITEM(mtsLarHotStartReq),
	CMD_TBL_ITEM(mtsLarLnsAidingStart),
	CMD_TBL_ITEM(mtsLarLnsAidingStop),
	CMD_TBL_ITEM(mtsSetGcuDio),
	CMD_TBL_ITEM(mtsCluArm1TestOn),
	CMD_TBL_ITEM(mtsCluArm1TestOff),
	CMD_TBL_ITEM(mtsCluEdResetTestOn),
	CMD_TBL_ITEM(mtsCluEdResetTestOff),
	CMD_TBL_ITEM(mtsCluLiftOffTestOn),
	CMD_TBL_ITEM(mtsCluLiftOffTestOff),
	CMD_TBL_ITEM(mtsTxGcuCtrlCmd),
	CMD_TBL_ITEM(mtsLnsSetTravelLock),
	CMD_TBL_ITEM(mtsLnsChkBit),
	CMD_TBL_ITEM(mtsLnsALignStart),
	CMD_TBL_ITEM(mtsLnsAlignDone),
	CMD_TBL_ITEM(mtsTaStart),
	CMD_TBL_ITEM(mtsTaLchUp),
	CMD_TBL_ITEM(mtsTaDataInputStart),
	CMD_TBL_ITEM(mtsTaDataInputStop),
};

LOCAL int g_numCmdFunc = NELEMENTS(g_cmdTblItems);
LOCAL int g_numCmdFuncAdded = 0;

const ModuleInst *g_hCmdExec = (ModuleInst *)&g_stCmdExecInst;

char	g_szArgs[GUI_CMD_ARG_MAX_NUM][GUI_CMD_ARG_MAX_SIZE];
UINT32	g_dwArgMask = UINT32_MAX;

LOCAL STATUS	InitCmdExec(CmdExecInst *this);
LOCAL STATUS	FinalizeCmdExec(CmdExecInst *this);
LOCAL STATUS	ExecuteCmdExec(CmdExecInst *this);

LOCAL void		OnStart(CmdExecInst *this);
LOCAL void		OnStop(CmdExecInst *this);
LOCAL STATUS	OnExecute(CmdExecInst *this, OPS_TYPE_TEST_CONTROL *pTestControl);

LOCAL void		removeBlank(char *szArg);
LOCAL STATUS	setArgMask(char *szArg);
LOCAL STATUS	parseArgs(char *szArg);

LOCAL STATUS 	startCmd(CmdExecInst *this, char *szCmd, char *szArg);
LOCAL STATUS	stopCmd(CmdExecInst *this);

LOCAL STATUS 	InitCmdExec(CmdExecInst *this) {
	this->taskId = taskIdSelf();
	this->state = STOP;
	this->cmdPoolId = NULL;
	this->cmdTblId = NULL;
	this->tidCmdExec = TASK_ID_NULL;
	g_numCmdFuncAdded = 0;
	
	this->ipcObj.msgQId = msgQCreate(CMD_EXEC_MSG_Q_LEN,
									sizeof(CmdExecMsg), MSG_Q_FIFO);
	if (!(this->ipcObj.msgQId)) {
		LOGMSG("Message Q Creation Fail!\n");
		return ERROR;
	}
	
	this->cmdPoolId = memPartCreate((char *)g_cmdTblPool, CMD_TBL_POOL_SIZE);
	if(this->cmdPoolId == NULL) {
		LOGMSG("MemPart Creation Fail! (errNo: 0x%08X)\n", errnoGet());
		printErrno(errnoGet());
		return ERROR;
	}
	
	this->cmdTblId = symTblCreate(7, FALSE, this->cmdPoolId);
	if(this->cmdTblId == NULL) {
		LOGMSG("SymTbl Creation Fail! (errNo: 0x%08X)\n", errnoGet());
		printErrno(errnoGet());
		return ERROR;
	}
	
	int i;
	for (i = 0; i < g_numCmdFunc; i++) {
		if (symAdd(this->CcmdTblId, g_cmdTblItems[i].name, (SYM_VALUE)g_cmdTblItems[i].pfn,
				SYM_GLOBAL | SYM_TEST, 1) == ERROR) {
			LOGMSG("symAdd() error! (errNo: 0x%08X)\n", errnoGet());
			printErrno(errnoGet());
			
			g_numCmdFuncAdded = i + 1;
			
			return ERROR;
		}
	}
	
	g_numCmdFuncAdded = i;

	return OK;
}

LOCAL STATUS FinalizeCmdExec(CmdExecInst *this) {
	STATUS nRet = OK;
	