#define DEBUG_MSG

#include <timers.h>
#include <tickLib.h>
#include <stdio.h>

#include "../drv/axiDio.h"
#include "../drv/axiAdc.h"
#include "../drv/axiSdlc.h"
#include "../lib/util/isDebug.h"
#include "../lib/mtsLibPsCtrl.h"
#include "../lib/steLib.h"
#include "common.h"
#include "Monitoring.h"
#include "LogSend.h"
#include "UdpRecvRs1.h"
#include "UdpRecvRs4.h"

#define MONITORING_MSG_Q_LEN	(20)
#define MONITORING_PERIOD_SEC	(0)
#define MONITORING_PREIOD_NS	(20000000)
#define MONITORING_OFFSET_SEC	MONITORING_PERIOD_SEC
#define MONITORING_OFFSET_NS	MONITORING_PERIOD_NS

typedef enum {
	RUNNING,
	STOP
} MonitoringState;

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
	MonitoringState state;
	timer_t			timerId;
} MonitoringInst;

LOCAL MonitoringInst g_stMonitoringInst = {
	TASK_ID_ERROR, MSGQ, {MSG_Q_ID_NULL}, "",
};
LOCAL struct itimerspec g_stMonitoringTimer = {
	{MONITORING_PERIOD_SEC, MONITORING_PERIOD_NS},
	{MONITORING_OFFSET_SEC, MONITORING_OFFSET_NS},
};

LOCAL LOG_DATA g_stMonitoringLog;
LOCAL TM_COMM_STS g_tmCommSts = {0,};

const ModuleInst *g_hMonitoring = (ModuleInst *)&g_stMonitoringInst;

TM_COMM_STS * g_pTmCommSts = &g_tmCommSts;

LOCAL STATUS	InitMonitoring(MonitoringInst *this);
LOCAL STATUS	FinalizeMonitoring(MonitoringInst *this);
LOCAL STATUS	ExecuteMonitoring(MonitoringInst *this);

LOCAL STATUS	Onstart(MonitoringInst *this);
LOCAL STATUS	OnStop(MonitoringInst *this);
LOCAL STATUS	OnExecute(MonitoringInst *this);

LOCAL void		Monitoring_TimerHandler(timer_t timerId, _Vx_usr_arg_t arg);

LOCAL STATUS InitMonitoring(MonitoringInst *this) {
	this->taskId = taskIdSelf();
	this->state = STOP;
	
	this->ipcObj.msgQId = msgQCreate(MONITORING_MSG_Q_LEN,
									sizeof(MonitoringMsg), MSG_Q_FIFO);
	if (!(this->ipcObj.msgQId)) {
		LOGMSG("Message Q Creation Fail!\n");
		return ERROR;
	}
	
	if (timer_create(CLOCK_MONOTONIC, NULL, &(this->timerId)) == ERROR) {
		LOGMSG("Timer Creation Fail!\n");
		return ERROR;
	} else {
		timer_cancel(this->timerId);
		timer_connect(this->timerId, Monitoring_TimerHandler,
						(_Vx_usr_arg_t)this);
	}
	
	g_stMonitoringLog.formatted.index.kind = LOG_SEND_INDEX_KIND_MTE_STS;
	g_stMonitoringLog.formatted.index.id = LOG_SEND_INDEX_ID_MONITORING;
	
	return OK;
}

LOCAL STATUS FinalizeMonitoring(MonitoringInst *this) {
	STATUS nRet = OK;
	
	if (this->ipcObj.msgQId) {
		if (msgQDelete(this->ipcObj.msgQId)) {
			LOGMSG("msgQDelete() error!\n";
			nRet = ERROR;
		} else {
			this->ipcObj.msgQId = NULL;
		}
	}
	
	if (this->timerId) {
		if (timer_cancel(this->timerId)) {
			LOGMSG("timer_cancel() error!\n");
			nRet = ERROR;
		}
		if (timer_delete(this->timerId)) {
			LOGMSG("timer_delete() error!\n");
			nRet = ERROR;
		}
	}
	
	return nRet;
}

LOCAL STATUS ExecuteMonitoring(MonitoringInst *this) {
	STATUS nRet = OK;
	MonitoringMsg stMsg;
	
	FOREVER {
		if (msgQReceive(this->ipcObj.msgQId, (char *)&stMsg, sizeof(stMsg),
						WAIT_FOREVER) == ERROR) {
			LOGMSG("msgQReceive() Error!\n");
			nRet = ERROR;
			break;
		}
						
#ifdef USE_CHK_TASK_STATUS
		updateTaskStatus(this-?taskStatus);
#endif
		if (stMsg.cmd == MONITORING_QUIT)
			break;
		switch (stMsg.cmd) {
		case MONITORING_START:
			OnStart(this);
			break;
		case MONITORING_STOP;
			OnStop(this);
			break;
		case MONITORING_EXECUTE;
			OnExecute(this);
			break;
		}
	}
		
		return nRet;
}

LOCAL void Monitoring_TimerHandler(timer_t timerId, _Vx_usr_arg_t arg) {
	MonitoringInst *this = (MonitoringInst *)arg;
	
	PostCmd(this, MONITORING_EXECUTE);
}

LOCAL STATUS OnStart(MonitoringInst *this) {
	if (this->state == RUNNING)
		return ERROR:
	
	if (timer_settime(this->timerId, TIMER_RELTIME, &g_stMonitoringTimer, NULL)) {
		LOGMSG("timer_settime() Error!\n");
		return ERROR;
	} else {
		this->state = RUNNING;
		return OK;
	}
	
	return OK;
}

LOCAL STATUS OnStop(MonitoringInst *this) {
	if (this->state == STOP)
		return ERROR;
	
	if (timer_cancel(this->timerId)) {
		LOGMSG("timer_cancel() Error!\n");
		return ERROR;
	} else {
		this->state = STOP;
		return OK;
	}
}

LOCAL STATUS OnExecute(MonitoringInst *this) {
	if (this->state == STOP)
		return ERROR;
	
	MonitoringLog *pLogBody = &g_stMonitoringLog.formatted.body.monitoring;
	static UINT32 precPwrMslExtEn = 0;
	UINT32 currPwrMslExtEn = 0;
#ifdef CLEAR_LAR_BUFFER
	static UINT32 prevPwrLarPg = 0;
	UINT32 currPwrLarPg = 0;
#endif
#ifdef CLEAR_LNS_BUFFER
	static UINT32 prevPwrLnsPg = 0;
	UINT32 currPwrLnsPg = 0;
#endif
	
	pLogBody->diSys.dword = axiDioDiSysRead();
	pLogBody->diBit.dword = axiDioDiBitRead();
	pLogBody->diBit.bit.pwrAbatPg = g_bIsPsOutputOn;
	pLogBody->mteBit = (pLogBody->diBit.dword & 0xF) ^ 0xF;
	
	pLogBody->doSys.dword = axiDioDoSysRead();
	pLogBody->ppsCtrl.dword = axiDioPpsCtrlRead();
	pLogBody->ppsEnable.dword = axiDioPpsEnableRead();
	pLogBody->ppsIntSts.dword = axiDioPpsIntStsRead();
	
	pLogBody->main28vVoltage = mtsLibAdcMain28vVoltage();
	pLogBody->main28vCUrrent = mtsLibAdcMain28vCurrent();
	pLogBody->main5vVoltage = mtsLibAdcMain5vVoltage();
	pLogBody->main5vCurrent = mtsLibAdcMain5vCurrent();
	pLogBody->mslExtVoltage = mtsLibAdcMslExtVoltage();
	pLogBody->mslExtCurrent = mtsLibAdcMslExtCurrent();
	pLogBody->cluExtVoltage = mtsLibAdcCluExtVoltage();
	pLogBOdy->cluExtCurrent = mtsLibAdcCluExtCurrent();
	pLogBody->tlmExtVoltage = mtsLibAdcTlmExtVoltage();
	pLogBody->tlmExtCurrent = mtsLibAdcTlmExtCurrent();
	
	pLogBody->ps130VdcMon = mtsLibAdcPps130VdcMon();
	pLogBody->press = mtsLibAdcPress();
	
	pLogBody->dacChannel = aciAdc1DacCh();
	pLogBody->dacValue = axiAdc1DacValue();
	
	currPwrMslExtEn = pLogBody->doSys.bit.pwrMslExtEn;
#if 1
	if ((prevPwrMslExtEn == 0) && (currPwrMslExtEn == 1)) {
		PostCmd(g_hSdlcRecvGcu, SDLC_RECV_GCU_INIT_RX_FRAME);
	}
#else
	if ((prevPwrMslExtEn == 1) && (currPwrMslExtEn == 0)) {
		addDeferredWork(g_hSdlcRecvGcu, GET_DELAY_TICK(500), SDLC_RECV_GCU_INIT_RX_FRAME);
	}
#endif
	prevPwrMslExtEn = currPwrMslExtEn;
	
#ifdef CLEAR_LAR_BUFFER
	currPwrLarPg = steLibDiBitPwrLarPg();
#if 1
	if ((prevPwrLarPg == 0) && (currPwrLarPg == 1)) {
		PostCmd(g_hUdpRecvLar, UDP_RECV_LAR_INIT_RX_FRAMES);
	}
#else
	if ((prevPwrLarPg == 1) && (currPwrLarPg == 0)) {
		addDeferredWork(g_hUdpRecvLar, GET_DELAY_TICK(500_, UDP_RECV_LAR_INIT_RX_FRAMES);
	}
#endif
	prevPwrLarPg = currPwrLarPg;
#endif

#ifdef CLEAR_LNS_BUFFER
	currPwrLnsPg = steLibDiBitPwrLnsPg();
#if 1
	if ((prevPwrLnsPg == 0) && (currPwrLnsPg == 1)) {
		PostCmd(g_hUdpRecvRs1, UDP_RECV_RS1_INIT_RX_FRAMES);
		PostCmd(g_hUdpRecvRs4, UDP_RECV_RS4_INIT_RX_FRAMES);
	}
#else
	if ((prevPwrlnsPg == 1) && (currPwrlnsPg == 0)) {
		addDeferredWork(g_hUdpRecvRs1, GET_DELAY_TICK(500), UDP_RECV_RS1_INIT_RX_FRAMES);
		addDeferredWork(g_hUdpRecvRs4, GET_DELAY_TICK(500), UDP_RECV_RS4_INIT_RX_FRAMES);
	}
#endif
	prevPwrLnsPg = currPwrLnsPg;
#endif
	g_stMonitoringLog.formatted.tickLog = tickGet();
	PostLogSendCmdEx(LOG_SENT_TX, (const char *)(&g_stMonitoringLog),
					sizeof(MonitoringLog) + OFFSET(LOG_DATA, formatted.body));
					
	return OK;
}

void MonitoringMain(ModuleInst *pModuleInst) {
	MonitoringInst *this = (MonirotingInst *)pModuleInst;
	
	if (InitMonitoring(this) == ERROR) {
		LOGMSG("InitMonitoring() error!!\n");
	} else if (ExecuteMonitoring(this) == ERROR) {
		LOGMSG("ExecuteMonitoring() error!!\n");
	}
	if (FinalizeMonitoring(this) == ERROR) {
		LOGMSG("FinalizeMonitoring() error!!\n");
	}
}

void mtsShowTmCommSts(void) {
	g_pTmCommSts->wCrcErrCnt = (UINT16)axiSdlcGetRxCrcCnt(0);
	
	printf("\n g_pTmCommSts->wAddressErrCnt		= 0x%08x", g_pTmCommSts->wAddressErrCnt);
	printf("\n g_pTmCommSts->wControlErrCnt		= 0x%08x", g_pTmCommSts->wControlErrCnt);
	printf("\n g_pTmCommSts->wCrcErrCnt			= 0x%08x", g_pTmCommSts->wCrcErrCnt);
	printf("\n");
	printf("\n g_pTmCommSts->wFg2TxCnt			= 0x%08x", g_pTmCommSts->wFg2TxCnt);	
	printf("\n g_pTmCommSts->wFg3TxCnt			= 0x%08x", g_pTmCommSts->wFg3TxCnt);
	printf("\n g_pTmCommSts->wFg5TxCnt			= 0x%08x", g_pTmCommSts->wFg5TxCnt);
	printf("\n g_pTmCommSts->wFg6TxCnt			= 0x%08x", g_pTmCommSts->wFg6TxCnt);	
	printf("\n g_pTmCommSts->wFg7TxCnt			= 0x%08x", g_pTmCommSts->wFg7TxCnt);		
	printf("\n g_pTmCommSts->wFg2TxErrCnt		= 0x%08x", g_pTmCommSts->wFg2TxErrCnt);	
	printf("\n g_pTmCommSts->wFg3TxErrCnt		= 0x%08x", g_pTmCommSts->wFg3TxErrCnt);	
	printf("\n g_pTmCommSts->wFg5TxErrCnt		= 0x%08x", g_pTmCommSts->wFg5TxErrCnt);	
	printf("\n g_pTmCommSts->wFg6TxErrCnt		= 0x%08x", g_pTmCommSts->wFg6TxErrCnt);	
	printf("\n g_pTmCommSts->wFg7TxErrCnt		= 0x%08x", g_pTmCommSts->wFg7TxErrCnt);	
	printf("\n");
	printf("\n g_pTmCommSts->wFg61TxCnt			= 0x%08x", g_pTmCommSts->wFg61TxCnt);	
	printf("\n g_pTmCommSts->wFg62TxCnt			= 0x%08x", g_pTmCommSts->wFg62TxCnt);
	printf("\n g_pTmCommSts->wFg63TxCnt			= 0x%08x", g_pTmCommSts->wFg63TxCnt);
	printf("\n g_pTmCommSts->wFg64TxCnt			= 0x%08x", g_pTmCommSts->wFg64TxCnt);	
	printf("\n g_pTmCommSts->wFg65TxCnt			= 0x%08x", g_pTmCommSts->wFg65TxCnt);		
	printf("\n");
	printf("\n g_pTmCommSts->wGf2TxCnt			= 0x%08x", g_pTmCommSts->wGf2TxCnt);	
	printf("\n g_pTmCommSts->wGf3TxCnt			= 0x%08x", g_pTmCommSts->wGf3TxCnt);
	printf("\n g_pTmCommSts->wGf5TxCnt			= 0x%08x", g_pTmCommSts->wGf5TxCnt);
	printf("\n g_pTmCommSts->wGf6TxCnt			= 0x%08x", g_pTmCommSts->wGf6TxCnt);	
	printf("\n g_pTmCommSts->wGf7TxCnt			= 0x%08x", g_pTmCommSts->wGf7TxCnt);
	printf("\n g_pTmCommSts->wGf8TxCnt			= 0x%08x", g_pTmCommSts->wGf8TxCnt);	
	printf("\n g_pTmCommSts->wGf9TxCnt			= 0x%08x", g_pTmCommSts->wGf9TxCnt);
	printf("\n g_pTmCommSts->wGf11TxCnt			= 0x%08x", g_pTmCommSts->wGf11TxCnt);
	printf("\n g_pTmCommSts->wGf12TxCnt			= 0x%08x", g_pTmCommSts->wGf12TxCnt);	
	printf("\n");
	printf("\n g_pTmCommSts->wGf21TxCnt			= 0x%08x", g_pTmCommSts->wGf21TxCnt);	
	printf("\n g_pTmCommSts->wGf22TxCnt			= 0x%08x", g_pTmCommSts->wGf22TxCnt);
	printf("\n g_pTmCommSts->wGf23TxCnt			= 0x%08x", g_pTmCommSts->wGf23TxCnt);
	printf("\n g_pTmCommSts->wGf24TxCnt			= 0x%08x", g_pTmCommSts->wGf24TxCnt);	
	printf("\n g_pTmCommSts->wGf28TxCnt			= 0x%08x", g_pTmCommSts->wGf28TxCnt);
	printf("\n g_pTmCommSts->wGf29TxCnt			= 0x%08x", g_pTmCommSts->wGf29TxCnt);	
	printf("\n");
	printf("\n g_pTmCommSts->wFg61TxCnt			= 0x%08x", g_pTmCommSts->wFg61TxCnt);	
	printf("\n g_pTmCommSts->wFg62TxCnt			= 0x%08x", g_pTmCommSts->wFg62TxCnt);
	printf("\n g_pTmCommSts->wFg63TxCnt			= 0x%08x", g_pTmCommSts->wFg63TxCnt);
	printf("\n g_pTmCommSts->wFg64TxCnt			= 0x%08x", g_pTmCommSts->wFg64TxCnt);	
	printf("\n g_pTmCommSts->wFg65TxCnt			= 0x%08x", g_pTmCommSts->wFg65TxCnt);		
	printf("\n");
	printf("\n g_pTmCommSts->wGf72TxCnt			= 0x%08x", g_pTmCommSts->wGf72TxCnt);	
	printf("\n g_pTmCommSts->wGf73TxCnt			= 0x%08x", g_pTmCommSts->wGf73TxCnt);
	printf("\n g_pTmCommSts->wGf74TxCnt			= 0x%08x", g_pTmCommSts->wGf74TxCnt);
	printf("\n g_pTmCommSts->wGf75TxCnt			= 0x%08x", g_pTmCommSts->wGf75TxCnt);	
	printf("\n g_pTmCommSts->wGf76TxCnt			= 0x%08x", g_pTmCommSts->wGf76TxCnt);
	printf("\n g_pTmCommSts->wGf77TxCnt			= 0x%08x", g_pTmCommSts->wGf77TxCnt);
	printf("\n g_pTmCommSts->wGf78TxCnt			= 0x%08x", g_pTmCommSts->wGf78TxCnt);
	printf("\n g_pTmCommSts->wGf79TxCnt			= 0x%08x", g_pTmCommSts->wGf79TxCnt);	
	printf("\n");
	printf("\n g_pTmCommSts->wGf2OpCodeErrCnt	= 0x%08x", g_pTmCommSts->wGf2OpCodeErrCnt);	
	printf("\n g_pTmCommSts->wGf3OpCodeErrCnt	= 0x%08x", g_pTmCommSts->wGf3OpCodeErrCnt);
	printf("\n g_pTmCommSts->wGf5OpCodeErrCnt	= 0x%08x", g_pTmCommSts->wGf5OpCodeErrCnt);
	printf("\n g_pTmCommSts->wGf6OpCodeErrCnt	= 0x%08x", g_pTmCommSts->wGf6OpCodeErrCnt);	
	printf("\n g_pTmCommSts->wGf7OpCodeErrCnt	= 0x%08x", g_pTmCommSts->wGf7OpCodeErrCnt);
	printf("\n");
	printf("\n g_pTmCommSts->wGf2SizeErrCnt		= 0x%08x", g_pTmCommSts->wGf2SizeErrCnt);	
	printf("\n g_pTmCommSts->wGf3SizeErrCnt		= 0x%08x", g_pTmCommSts->wGf3SizeErrCnt);
	printf("\n g_pTmCommSts->wGf5SizeErrCnt		= 0x%08x", g_pTmCommSts->wGf5SizeErrCnt);	
	printf("\n g_pTmCommSts->wGf6SizeErrCnt		= 0x%08x", g_pTmCommSts->wGf6SizeErrCnt);
	printf("\n g_pTmCommSts->wGf7SizeErrCnt		= 0x%08x", g_pTmCommSts->wGf7SizeErrCnt);	
	printf("\n g_pTmCommSts->wGf8SizeErrCnt		= 0x%08x", g_pTmCommSts->wGf8SizeErrCnt);
	printf("\n g_pTmCommSts->wGf9SizeErrCnt		= 0x%08x", g_pTmCommSts->wGf9SizeErrCnt);
	printf("\n g_pTmCommSts->wGf11SizeErrCnt	= 0x%08x", g_pTmCommSts->wGf11SizeErrCnt);
	printf("\n g_pTmCommSts->wGf12SizeErrCnt	= 0x%08x", g_pTmCommSts->wGf12SizeErrCnt);
	printf("\n");
}

