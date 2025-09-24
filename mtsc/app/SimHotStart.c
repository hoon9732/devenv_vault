#define DEBUG_MSG

#include <stdio.h>
#include <string.h>
#include <inetLib.h>

#include "../lib/util/isDebug.h"
#include "../lib/util/isUtil.h"
#include "../lib/mtsLib.h"
#include "../drv/axiDio.h"
#include "typedef/tmType/tmTypeFg6.h"
#include "common.h"
#include "SimHotStart.h"
#include "UdpSendOps.h"
#include "SdlcSendGcu.h"

#define SIM_HOTSTART_MSG_Q_LEN		(20)
#define SIM_HOTSTART_DATA_FILE		(NET_DEV_REPO_NAME "/HotStart.bin")
#define SIM_HOTSTART_MAX_FG6_FRAMES	(1000)
#define SIM_HOTSTART_FRAME_SIZE		(sizeof(TM_TYPE_FG6))
#define SIM_HOTSTART_FRAME_GAP_TIME	(3)

typedef enum {
	RUNNING,
	STOP
} SimHotStartState;

typedef struct {
	TASK_ID				taskId;
	ModuleType			ipcType;
	union {
		MSG_Q_ID 		msgQId;
		int				pipeFd;
		int				quitFlag;
	} ipcObj;
	char				deferredWorkName[32];
#ifdef USE_CHK_TASK_STATUS
	TaskStatus *		taskStatus;
#endif
	SimHotStartState	state;
	SdlcSendGcuMsg		fg6Frames[SIM_HOTSTART_MAX_FG6_FRAMES];
	int 				numFg6Frames;
	int					currIdx;
} SimHotStartInst;

LOCAL SimHotStartInst g_stSimHotStartInst = {
	TASK_ID_ERROR, MSGQ, {MSG_Q_ID_NULL}, "",
};

const ModuleInst *g_hSimHotStart = (ModuleInst *)&g_stSimHotStartInst;

LOCAL STATUS	InitSimHotStart(SimHotStartInst *this);
LOCAL STATUS 	FinalizeSimHotStart(SimHotStartInst *this);
LOCAL STATUS 	ExecuteSimHotStart(SimHotStartInst *this);

LOCAL STATUS 	Onstart(SimHotStartInst *this, const SimHotStartMsg *pRxMsg);
LOCAL STATUS 	OnStop(SimHotStartInst *this, const SimHotStartMsg *pRxMsg);
LOCAL STATUS 	OnLoadData(SimHotStartInst *this, const SimHotStartMsg *pRxMsg);
LOCAL STATUS 	OnTx(SimHotStartInst *this);

LOCAL void		SimHotStart_PpsIsr(PPS_ISR_ARG arg);

LOCAL STATUS InitSimHotStart(SimHotStartInst *this) {
	
	this->taskId = taskIdSelf();
	this->state = STOP;
	memset(this->fg6Frames, 0, sizeof(this->fg6Frames));
	this->numFg6Frames = 0;
	this->currIdx = 0;
	
	int i;
	for (i = 0; i < NELEMENTS(this->fg6Frames); i++) {
		this->fg6Frames[i].cmd = SDLC_SEND_GCU_TX;
		this->fg6Frames[i].len = SIM_HOTSTART_FRAME_SIZE;
	}
	
	this->ipcObj.msgQId = msgQCreate(SIM_HOTSTART_MSG_Q_LEN,
									sizeof(SimHotStartMsg), MSG_Q_FIFO);
	if (!(this->ipcObj.msgQId)) {
		LOGMSG("Message Q Creation Fail!\n");
		return ERROR;
	}
	
	return OK;
}

LOCAL STATUS FinalizeSimHotStart(SimHotStartInst *this) {
	STATUS nRet = OK;
	
	if (this->ipcObj.msgQId) {
		if (msgQDelete(this->ipcObj.msgQId)) {
			LOGMSG("msgQDelete() error!\n");
			nRet = ERROR;
		} else {
			this->ipcObj.msgQId = NULL;
		}
	}
	
	return nRet;
}

LOCAL STATUS ExecuteSimHotStart(SimHotStartInst *this) {
	STATUS nRet = OK;
	SimHotStartMsg stMsg;
	
	FOREVER {
		if (msgQReceive(this->ipcObj.msgQId, (char *)&stMsg, sizeof(stMsg),
						WAIT_FOREVER) == ERROR) {
			LOGMSG("msgQReceive() Error!\n");
			nRet = ERROR;
			break;
		}
#ifdef USE_CHK_TASK_STATUS
		updateTaskStatus(this->taskStatus);
#endif	

		if (stMsg.cmd == SIM_HOTSTART_QUIT)
			break;
		
		switch (stMsg.cmd) {
			case SIM_HOTSTART_START:
				OnStart(this, &stMsg);
				break;
			case SIM_HOTSTART_STOP:
				OnStop(this, &stMsg);
				break;
			case SIM_HOTSTART_LOAD_DATA:
				OnLoadData(this, &stMsg);
				break;
			case SIM_HOTSTART_TX:
				OnTx(this);
				break;
		}
	}
	
	return nRet;
}

LOCAL STATUS OnStart(SimHotStartInst *this, const SimHotStartMsg *pRxMsg) {
	if (this->state == RUNNING)
		return ERROR;
	
	BOOL reportResult =
		(((pRxMsg->len == 0) || (pRxMsg->body.reportResult == FALSE)) ? FALSE : TRUE);
	
	if (this->numFg6Frames <= 0 ) {
		DEBUG("There are no FG6 frames...\n");
		if (reportResult == TRUE)
			UdpSendOpsTxResult(RESULT_TYPE_FAIL, "ERROR");
	}
	
	this->state = RUNNING;
	
	this->currIdx = 0;
	axiDioSetPpsIsr(SimHotStart_PpsIsr, NULL);
	if (mtsLibPpsCtrlSource(PPS_SOURCE_INTERNAL) == ERROR) {
		DEBUG("mtsLibPpsCtrlSource(Internal) Error.\n");
		if (reportResult == TRUE)
			UdpSendOpsTxResult(RESULT_TYPE_FAIL, "ERROR");
		
		return ERROR;
	}
	
	if (mtsLibPpsIntEn(TRUE) == ERROR) {
		DEBUG("mtsLibPpsIntEn(TRUE) Error. \n");
		if (reportResult == TRUE)
			UdpSendOpsTxResult(RESULT_TYPE_FAIL, "ERROR");
		
		return ERROR;
	}
	
	if (reportResult == TRUE)
		UdpSendOpsTxResult(RESULT_TYPE_PASS, "OK");
	
	return OK;
}

LOCAL STATUS OnStop(SimHotStartInst *this, const SimHotStartMsg *pRxMsg) {
	this->state = STOP;
	
	BOOL reportResult =
		(((pRxMsg->len == 0) || (pRxMsg->body.reportResult == FALSE)) ? FALSE : TRUE);
		
	if (mtsLibPpsIntEn(FALSE) == ERROR) {
		DEBUG("mtsLibPpsIntEn(FALSE) Error.\n");
		if (reportResult == TRUE)
			UdpSendOpsTxResult(RESULT_TYPE_FAIL, "ERROR");
		
		return ERROR;
	}
	
	if (mtsLibPpsCtrlSource(PPS_SOURCE_EXTERNAL) == ERROR) {
		DEBUG("mtsLibPpsCtrlSource(External) Error.\n");
		if (reportResult == TRUE)
			UdpSendOpsTxResult(RESULT_TYPE_FAIL, "ERROR");
		
		return ERROR;
	}
	axiDioSetPpsIsr(NULL, NULL);
	
	if (reportResult == TRUE)
		UdpSendOpsTxResult(RESULT_TYPE_PASS, "OK");
	
	return OK;
}

LOCAL STATUS OnLoadData(SimHotStartInst *this, const SimHotStartMsg *pRxMsg) {
	if (this->state == RUNNING) {
		LOGMSG("Sim. HotStart is running...\n");
		LOGMSG("Cannot load sim. data...!!\n");
		
		return ERROR;
	}
	
	FILE *fpFile;
	size_t readBytes;
	BOOL reportResult =
		(((pRxMsg->len == 0) || (pRxMsg->body.reportResult == FALSE)) ? FALSE : TRUE);
		
	if ((fpFile = fopen(SIM_HOTSTART_DATA_FILE, "rb")) == NULL) {
		DEBUG("Cannot open %s...!!", SIM_HOTSTART_DATA_FILE);
		if (reportResult == TRUE)
			UdpSendOpsTxResult(RESULT_TYPE_FAIL, "ERROR");
		
		return ERROR;
	}
		
	this->numFg6Frames = 0;
	
	FOREVER {
		readBytes = fread(this->fg6Frames[this->numFg6Frames].body.buf,
							1, SIM_HOTSTART_FRAME_SIZE, fpFile);
		
		if (readBytes < SIM_HOTSTART_FRAME_SIZE) {
			LOGMSG(" %d Frames Read.\n", this->numFg6Frames);
			break;
		}
		
		this->numFg6Frames++;
	}
	
	if (fclose(fpFile) == EOF) {
		DEBUG("Cannot close %s...!!", SIM_HOTSTART_DATA_FILE);
		
		return ERROR;
	}
	
	if (reportResult == TRUE) 
		UdpSendOpsTxResult(RESULT_TYPE_PASS, "OK");
	
	return OK;
}

LOCAL STATUS OnTx(SimHotStartInst *this) {
	if (this->state == STOP)
		return ERROR;
	
	if ((this->numFg6Frames <= 0) || (this->currIdx >= this->numFg6Frames)) {
		PostCmd(this, SIM_HOTSTART_STOP);
		return ERROR;
	}
	
	BOOL isTxDone = FALSE;
	CODE opcode;
	
	opcode = htons(this->fg6Frames[this->currIdx].body.sdlcTx.fg6.fg6_1.m_OPCODE);
	if ((opcode & 0xFF00) == TM_FG6_1_OPCODE) {
		PostCmdEx(g_hSdlcSendGcu, &this->fg6Frames[this->currIdx++]);
	} else {
		LOGMSG("Curr. Frame is not FG6-1...!!\n");
		PostCmd(this, SIM_HOTSTART_STOP);
		return ERROR;
	}
	
	while (isTxDone == FALSE) {
		if (this->currIdx >= this->numFg6Frames) {
			isTxDone = TRUE;
			LOGMSG("All frames are transmitted...\n");
			PostCmd(this, SIM_HOTSTART_STOP);
			break;
		}
		
		opcode = ntohs(this->fg6Frames[this->currIdx].body.sdlcTx.fg6.fg6_1.m_OPCODE);
		switch (opcode & 0xFF00) {
			case TM_FG6_2_OPCODE:
			case TM_FG6_3_OPCODE:
			case TM_FG6_4_OPCODE:
			case TM_FG6_5_OPCODE:
				DELAY_MS(SIM_HOTSTART_FRAME_GAP_TIME);
				PostCmdEx(g_hSdlcSendGcu, &this->fg6Frames[this->currIdx++]);
				break;
			default:
				isTxDone = TRUE;
				break;
		}
	}
	
	return OK;
}

LOCAL void SimHotStart_PpsIsr(PPS_ISR_ARG arg) {
	PostCmd(g_hSimHotStart, SIM_HOTSTART_TX);
}

void SimHotStartMain(ModuleInst *pModuleInst) {
	SimHotStartInst *this = (SimHotStartInst *)pModuleInst;
	
	if (InitSimHotStart(this) == ERROR) {
		LOGMSG("InitSimHotStart() error!!\n");
	} else if (ExecuteSimHotStart(this) == ERROR) {
		LOGMSG("ExecuteSimHotStart() error!!\n");
	}
	if (FinalizeSimHotStart(this) == ERROR) {
		LOGMSG("FinalizeSimHotStart() error!!\n");
	}
}
	