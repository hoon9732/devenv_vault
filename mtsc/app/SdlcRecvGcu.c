#define DEBUG_MSG

#include <eventLib.h>
#include <msgQEvLib.h>
#include <semEvLib.h>
#include <string.h>
#include <math.h>

#include "../lib/util/isDebug.h"
#include "../drv/axiSdlc.h"
#include "typeDef/opsType.h"
#include "common.h"
#include "SdlcRecvGcu.h"
#include "LogSend.h"
#include "SdlcSwap.h"
#include "tickLib.h"
#include "Monitoring.h"

#define SDLC_RECV_GCU_MSG_Q_LEN		(20)
#define SDLC_RECV_GCU_EVENT_SDLC	(VXEV01)
#define SDLC_RECV_GCU_EVENT_CMD		(VXEV02)
#define SDLC_RECV_GCU_EVENTS \
	(SDLC_RECV_GCU_EVENT_SDLC | SDLC_RECV_GCU_EVENT_CMD)
	
#define NAV_VE_TOLERANCE			(0.5)
#define NAV_VN_TOLERANCE			(0.5)
#define NAV_VU_TOLERANCE			(0.5)
#define NAV_ALAT_TOLERANCE			(30.0)
#define NAV_ALONG_TOLERANCE			(30.0)
#define NAV_AHEIGHT_TOLERANCE		(60.0)

#define  SDLC_RECV_GCU_SDLC_CH		(0)

typedef enum {
	RUNNING,
	STOP
} SdlcRecvGcuState;

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
	TaskStatus *		taskStatus;
#endif
	SdlcRecvGcuState	state;
	SEM_ID				sidSdlcRx;
} SdlcRecvGcuInst;

LOCAL SdlcRecvGcuInst g_stSdlcRecvGcuInst = {
	TASK_ID_ERROR, MSGQ, {MSG_Q_ID_NULL}, "",
};

LOCAL TM_TYPE_SDLC_RX	g_stSdlcRxBuf;
LOCAL UINT32			g_nSdlcRxSize;

LOCAL LOG_DATA			g_tmGf2Log;
LOCAL LOG_DATA			g_tmGf3Log;
LOCAL LOG_DATA			g_tmGf5Log;
LOCAL LOG_DATA			g_tmGf6Log;
LOCAL LOG_DATA			g_tmGf7Log;
LOCAL LOG_DATA			g_tmGf8Log;
LOCAL LOG_DATA			g_tmGf9Log;
LOCAL LOG_DATA			g_tmGf11Log;
LOCAL LOG_DATA			g_tmGf12Log;

LOCAL LOG_DATA			g_monNavLog;

const ModuleInst *g_hSdlcRecvGcu = (ModuleInst *)&g_stSdlcRecvGcuInst;

TM_TYPE_SDLC_TX * g_pTmSdlcGfRx = &g_stSdlcRxBuf;
TM_TYPE_GF2 * g_pTmGf2 = &g_tmGf2Log.formatted.body.sdlcRx.gf2;
TM_TYPE_GF3 * g_pTmGf3 = &g_tmGf3Log.formatted.body.sdlcRx.gf3;
TM_TYPE_GF5 * g_pTmGf5 = &g_tmGf5Log.formatted.body.sdlcRx.gf5;
TM_TYPE_GF6 * g_pTmGf6 = &g_tmGf6Log.formatted.body.sdlcRx.gf6;
TM_TYPE_GF7 * g_pTmGf7 = &g_tmGf7Log.formatted.body.sdlcRx.gf7;
TM_TYPE_GF8 * g_pTmGf8 = &g_tmGf8Log.formatted.body.sdlcRx.gf8;
TM_TYPE_GF8 * g_pTmGf9 = &g_tmGf9Log.formatted.body.sdlcRx.gf9;
TM_TYPE_GF11 * g_pTmGf11 = &g_tmGf11Log.formatted.body.sdlcRx.gf11;
TM_TYPE_GF12 * g_pTmGf12 = &g_tmGf12Log.formatted.body.sdlcRx.gf12;

MonitoringNavLog * g_pMonNav = &g_monNavLog.formatted.body.monitoringNav;

LOCAL STATUS	InitSdlcRecvGcu(SdlcRecvGcuInst *this);
LOCAL STATUS	FinalizeSdlcRecvGcu(SdlcRecvGcuInst *this);
LOCAL STATUS	ExecuteSdlcRecvGcu(SdlcRecvGcuInst *this);

LOCAL void		OnStart(SdlcRecvGcuInst *this);
LOCAL void		OnStop(SdlcRecvGcuInst *this);
LOCAL STATUS	OnInitRxFrames(SdlcRecvGcuInst *this);

LOCAL STATUS 	procCommand(SdlcRecvGcuInst *this);
LOCAL STATUS	procSdlc(SdlcRecvGcuInst *this);

LOCAL STATUS	handleSdlcRxBuf(void);
LOCAL STATUS	handleSdlcGf2(void);
LOCAL STATUS	handleSdlcGf3(void);
LOCAL STATUS	handleSdlcGf5(void);
LOCAL STATUS	handleSdlcGf6(void);
LOCAL STATUS	handleSdlcGf7(void);
LOCAL STATUS	handleSdlcGf8(void);
LOCAL STATUS	handleSdlcGf9(void);
LOCAL STATUS	handleSdlcGf11(void);
LOCAL STATUS	handleSdlcGf12(void);

LOCAL int		mtsCheckRange(double dLowerLimit,
							  double dUpperLimit, double dMeasure);
LOCAL STATUS	calcNavData(void);

LOCAL STATUS	InitSdlcRecvGcu(SdlcRecvGcuInst *this) {
	this->taskId = taskIdSelf();
	this->state = STOP;
	this->sidSdlcRx = SEM_ID_NULL;
	
	this->ipcObj.msgQId = msgQCreate(SDLC_RECV_GCU_MSG_Q_LEN,
									 sizeof(SdlcRecvGcuMsg), MSG_Q_FIFO);
	if (!(this->ipcObj.msgQId)) {
		LOGMSG("Message Q Creation Fail!\n");
		return ERROR:
	}
	
	if (msgQEvStart(this->ipcObj.msgQId, SDLC_RECV_GCU_EVENT_CMD, 0)) {
		LOGMSG("msgQEvStart() error!\n");
		return ERROR;
	}
	
	if (axiSdlcGetRxSemaphore(SDLC_RECV_GCU_SDLC_CH, &this->sidSdlcRx) == ERROR) {
		LOGMSG("axiSdlcGetRxSemaphore(%d) error!\n", SDLC_RECV_GCU_SDLC_CH);
		return ERROR;
	}
	
	if ((this->sidSdlcRx != SEM_ID_NULL) &&
		semEvStart(this->sidSdlcRx,
				   SDLC_RECV_GCU_EVENT_SDLC, EVENTS_SEND_IF_FREE)) {
		LOGMSG("semEvStart() error!\n");
		return ERROR;
	}
	
	g_tmGf2Log.formatted.index.kind = LOG_SEND_INDEX_KIND_GCU;
	g_tmGf2Log.formatted.index.direction = LOG_SEND_INDEX_DIRECTION_RX;
	g_tmGf3Log.formatted.index.kind = LOG_SEND_INDEX_KIND_GCU;
	g_tmGf3Log.formatted.index.direction = LOG_SEND_INDEX_DIRECTION_RX;
	g_tmGf5Log.formatted.index.kind = LOG_SEND_INDEX_KIND_GCU;
	g_tmGf5Log.formatted.index.direction = LOG_SEND_INDEX_DIRECTION_RX;
	g_tmGf6Log.formatted.index.kind = LOG_SEND_INDEX_KIND_GCU;
	g_tmGf6Log.formatted.index.direction = LOG_SEND_INDEX_DIRECTION_RX;
	g_tmGf7Log.formatted.index.kind = LOG_SEND_INDEX_KIND_GCU;
	g_tmGf7Log.formatted.index.direction = LOG_SEND_INDEX_DIRECTION_RX;
	g_tmGf8Log.formatted.index.kind = LOG_SEND_INDEX_KIND_GCU;
	g_tmGf8Log.formatted.index.direction = LOG_SEND_INDEX_DIRECTION_RX;
	g_tmGf9Log.formatted.index.kind = LOG_SEND_INDEX_KIND_GCU;
	g_tmGf9Log.formatted.index.direction = LOG_SEND_INDEX_DIRECTION_RX;
	g_tmGf11Log.formatted.index.kind = LOG_SEND_INDEX_KIND_GCU;
	g_tmGf11Log.formatted.index.direction = LOG_SEND_INDEX_DIRECTION_RX;
	g_tmGf12Log.formatted.index.kind = LOG_SEND_INDEX_KIND_GCU;
	g_tmGf12Log.formatted.index.direction = LOG_SEND_INDEX_DIRECTION_RX;
	
	g_monNavLog.formatted.index.kind = LOG_SEND_INDEX_KIND_MTE_STS;
	g_monNavLog.formatted.index.id = LOG_SEND_INDEX_ID_MONITORING_NAV;
	
	return OK;
}

LOCAL STATUS FinalizeSdlcRecvGcu(SdlcRecvGcuInst *this) {
	STATUS nRet = OK;
	
	if (this->ipcObj.msgQId) {
		if (msgQEvStop(this->ipcObj.msgQId)) {
			LOGMSG("msgQEvStart() error!\n");
			nRet = ERROR;
		}
		
		if (msgQDelete(this->ipcObj.msgQId)) {
			LOGMSG("msgQDelete() error!\n");
			nRet = ERROR;
		} else {
			this->ipcObj.msgQId = NULL;
		}
	}
	
	if ((this->sidSdlcRx != SEM_ID_NULL) && semEvStop(this->sidSdlcRx)) {
		LOGMSG("semEvStop() error!\n");
		return ERROR;
	}
	
	return nRet;
}

LOCAL STATUS ExecuteSdlcRecvGcu(SdlcRecvGcuInst *this) {
	STATUS 		nRet = OK;
	_Vx_event_t	event;
	
	FOREVER {
		if (eventReceive(SDLC_RECV_GCU_EVENTS, EVENTS_WAIT_ANY,
						 WAIT_FOREVER, &event) == ERROR) {
			LOGMSG("eventReceive() Error!\n");
			nRet = ERROR;
			break;
		}

#ifdef USE_CHK_TASK_STATUS
		updateTaskStatus(this->taskStatus);
#endif
		if (event & SDLC_RECV_GCU_EVENT_CMD) {
			if (procCommand(this) == ERROR)
				break;
		}
		
		if (event & SDLC_RECV_GCU_EVENT_SDLC) {
			procSdlc(this);
		}
	}
	
	return nRet;
}

LOCAL void OnStart(SdlcRecvGcuInst *this) {
	this->state = RUNNING;
}

LOCAL void OnStop(SdlcRecvGcuInst *this) {
	this->state = STOP;
}

LOCAL STATUS OnInitRxFrames(SdlcRecvGcuInst *this) {
	if (this->state == STOP)
		return ERROR;
	
	memset(g_pTmSdlcGfRx, 0x0, sizeof(TM_TYPE_SDLC_RX));
	
	memset(g_pTmGf2, 0x0, sizeof(TM_TYPE_GF2));
	memset(g_pTmGf3, 0x0, sizeof(TM_TYPE_GF3));
	memset(g_pTmGf5, 0x0, sizeof(TM_TYPE_GF5));
	memset(g_pTmGf6, 0x0, sizeof(TM_TYPE_GF6));
	memset(g_pTmGf7, 0x0, sizeof(TM_TYPE_GF7));
	memset(g_pTmGf8, 0x0, sizeof(TM_TYPE_GF8));
	memset(g_pTmGf9, 0x0, sizeof(TM_TYPE_GF9));
	memset(g_pTmGf11, 0x0, sizeof(TM_TYPE_GF11));
	memset(g_pTmGf12, 0x0, sizeof(TM_TYPE_GF12));
						 
	return OK;
}

LOCAL STATUS procCommand(SdlcRecvGcuInst *this) {
	SdlcRecvGcuMsg stMsg;
	
	while (msgQReceive(this->ipcObj.msgQId, (char *)&stMsg, sizeof(stMsg),
					   NO_WAIT) != ERROR) {
		if (stMsg.cmd == SDLC_RECV_GCU_QUIT)
			return ERROR;
		
		switch (stMsg.cmd) {
			case SDLC_RECV_GCU_START:
				OnStart(this);
				break;
			case SDLC_RECV_GCU_STOP:
				OnStop(this);
				break;
			case SDLC_RECV_GCU_INIT_RX_FRAMES:
				OnInitRxFrames(this);
				break;
		}
	}
	return OK;
}

LOCAL STATUS procSdlc(SdlcRecvGcuInst *this) {
	if (this->state == STOP)
		return ERROR;
	
	if (semTake(this->sidSdlcRx, NO_WAIT) == ERROR)
		return ERROR;
	
	g_nSdlcRxSize = axiSdlcGetRxLen(SDLC_RECV_GCU_SDLC_CH);
	if (g_nSdlcRxSize > sizeof(TM_TYPE_SDLC_RX)) {
		LOGMSG("[%s] Invalid Rx. Size...(%d)\n",
			   SDLC_RECV_GCU_TASK_NAME, g_nSdlcRxSize);
			   
		return ERROR;
	}
	
	const void * restrict pAxiSdlcRxBuf = axiSdlcGetRxBuf(SDLC_RECV_GCU_SDLC_CH);
	if (pAxiSdlcRxBuf == NULL) {
		LOGMSG("Cannot Get SDLC Rx. Buffer...\n");
		
		return ERROR;
	}
	
	memcpy(g_pTmSdlcGfRx, pAxiSdlcRxBuf, g_nSdlcRxSize);
	
	if (g_pTmSdlcGfRx->gf2.m_ADDRESS != TM_SDLC_ADDRESS) {
		g_pTmCommSts->wAddressErrCnt++;
		
		return ERROR;
	}
	
	handleSdlcRxBuf();
	
	return OK;
}

LOCAL void handleSdlcRxBuf(void){
	switch (g_pTmSdlcGfRx->gf2.m_CONTROL) {
		case TM_GF2_SDLC_CONTROL:
			if (g_nSdlcRxSize == sizeof(TM_TYPE_GF2)) {
				handleSdlcGf2();
			}
			else {
				g_pTmCommSts->wGf2SizeErrCnt++;
			}
			break;	
		case TM_GF3_SDLC_CONTROL:
			if (g_nSdlcRxSize == sizeof(TM_TYPE_GF3)) {
				handleSdlcGf3();
			}
			else {
				g_pTmCommSts->wGf3SizeErrCnt++;
			}
			break;
		case TM_GF5_SDLC_CONTROL:
			if (g_nSdlcRxSize == sizeof(TM_TYPE_GF5)) {
				handleSdlcGf5();
			}
			else {
				g_pTmCommSts->wGf5SizeErrCnt++;
			}
			break;
		case TM_GF6_SDLC_CONTROL:
			if (g_nSdlcRxSize == sizeof(TM_TYPE_GF6)) {
				handleSdlcGf6();
			}
			else {
				g_pTmCommSts->wGf6SizeErrCnt++;
			}
			break;
		case TM_GF7_SDLC_CONTROL:
			if (g_nSdlcRxSize == sizeof(TM_TYPE_GF7)) {
				handleSdlcGf7();
			}
			else {
				g_pTmCommSts->wGf7SizeErrCnt++;
			}
			break;
		case TM_GF8_SDLC_CONTROL:
			if (g_nSdlcRxSize == sizeof(TM_TYPE_GF8)) {
				handleSdlcGf8();
			}
			else {
				g_pTmCommSts->wGf8SizeErrCnt++;
			}
			break;
		case TM_GF9_SDLC_CONTROL:
			if (g_nSdlcRxSize == sizeof(TM_TYPE_GF9)) {
				handleSdlcGf9();
			}
			else {
				g_pTmCommSts->wGf9SizeErrCnt++;
			}
			break;
		case TM_GF11_SDLC_CONTROL:
			if (g_nSdlcRxSize == sizeof(TM_TYPE_GF11)) {
				handleSdlcGf11();
			}
			else {
				g_pTmCommSts->wGf11SizeErrCnt++;
			}
			break;
		case TM_GF12_SDLC_CONTROL:
			if (g_nSdlcRxSize == sizeof(TM_TYPE_GF12)) {
				handleSdlcGf12();
			}
			else {
				g_pTmCommSts->wGf12SizeErrCnt++;
			}
			break;
		default:
			g_pTmCommSts->wControlErrCnt++;
			break;
	}
}

LOCAL void handleSdlcGf2(void) {
	tmSwapGf2();
	
	switch (g_pTmGf2->m_GCU_RESP & 0xFF00) {
		case TM_FG2_1_OPCODE_MODE_LAUNCH:
		case TM_FG2_1_OPCODE_MODE_HILS:
		case TM_FG2_1_OPCODE_MODE_TEST:
		case TM_FG2_1_OPCODE_MODE_GCU_PROGRAM:
		case TM_FG2_1_OPCODE_MSL_COMM_START:
		case TM_FG2_1_OPCODE_MSL_START_GNC:
		case TM_FG2_1_OPCODE_ACT_TEST_START:
		case TM_FG2_1_OPCODE_ACT_TEST_END:
			g_pTmCommSts->wGf2RxCnt++;
			g_pTmCommSts->wGf21RxCnt++;
			break;
		case TM_FG2_2_OPCODE:
			g_pTmCommSts->wGf2RxCnt++;
			g_pTmCommSts->wGf22RxCnt++;
			break;
		case TM_FG2_2_OPCODE:
			g_pTmCommSts->wGf2RxCnt++;
			g_pTmCommSts->wGf22RxCnt++;
			break;
		case TM_FG2_3_OPCODE:
			g_pTmCommSts->wGf2RxCnt++;
			g_pTmCommSts->wGf23RxCnt++;
			break;
		case TM_FG2_4_OPCODE:
			g_pTmCommSts->wGf2RxCnt++;
			g_pTmCommSts->wGf24RxCnt++;
			break;
			
		case TM_FG2_1_OPCODE_MSL_MOTOR_ON:
			g_pTmCommSts->wGf2RxCnt++;
			g_pTmCommSts->wGf28RxCnt++;
			break;
		
		case TM_FG2_2_OPCODE_MSL_LIFT_OFF_READY:
			g_pTmCommSts->wGf2RxCnt++;
			g_pTmCommSts->wGf29RxCnt++;
			break;
			
		case TM_FG3_1_OPCODE:
			g_pTmCommSts->wGf2RxCnt++;
			break;
			
		default:
			g_pTmCommSts->wGf2OpCodeErrCnt++;
			break;
	}
	
	g_tmGf2Log.formatted.tickLog = tickGet();
	g_tmGf2Log.formatted.index.id = 0x20;
	PostLogSendCmdEx(LOG_SEND_TX, (const char *)(&g_tmGf2Log),
					 sizeof(TM_TYPE_GF2) + OFFSET(LOG_DATA, formatted.body));
}

LOCAL void handleSdlcGf3(void) {
	tmSwapGf3();
	
	switch (g_pTmGf3->gf3_1.m_GCU_RESP & 0xFF00) {
		case TM_TCS_GCU_RESP_CODE_GF3_1:
			g_tmGf3Log.formatted.index.id = 0x31;
			g_pTmCommSts->wGf3RxCnt++;
			break;
			
		case TM_TCS_GCU_RESP_CODE_GF3_2:
			g_tmGf3Log.formatted.index.id = 0x32;
			g_pTmCommSts->wGf3RxCnt++;
			break;
		case TM_TCS_GCU_RESP_CODE_GF3_A:
		case TM_TCS_GCU_RESP_CODE_GF3_B:
			g_tmGf3Log.formatted.index.id = 0x33;
			g_pTmCommSts->wGf3RxCnt++;
			break;
		case TM_TCS_GCU_RESP_CODE_GF3_4:
			g_tmGf3Log.formatted.index.id = 0x34;
			g_pTmCommSts->wGf3RxCnt++;
			break;
		
		default:
			g_pTmCommSts->wGf3OpCodeErrCnt++;
			break;
	}
	
	g_tmGf3Log.formatted.tickLog = tickGet();
	PostLogSendCmdEx(LOG_SEND_TX, (const char *)(&g_tmGf3Log),
					 sizeof(TM_TYPE_GF3) + OFFSET(LOG_DATA, formatted, body));
}

LOCAL void handleSdlcGf5(void) {
	tmSwapGf5();
	
	switch (g_pTmGf5->m_MAR_RESP & 0xFF00) {
		case TM_GF5_OPCODE:
		g_pTmCommSts->wGf5RxCnt++;
		g_tmGf5Log.formatted.index.id = 0x50;
		break;
		
		default:
			g_pTmCommSts->wGf5OpCodeErrCnt++;
			break;
	}
	
	g_tmGf5Log.formatted.ticklog = tickGet();
	PostLogSendCmdEx(LOG_SEND_TX, (const char *)(&g_tmGf5Log),
					 sizeof(TM_TYPE_GF5) + OFFSET(LOG_DATA, formatted.body));
}

LOCAL void handleSdlcGf6(void) {
	tmSwapGf6();
	
	switch (g_pTmGf6->gf6_1.m_MAR_RESP & 0xFF00) {
		case TM_GF6_1_OPCODE:
			g_pTmCommSts->wGf6RxCnt++;
			g_pTmCommSts->wGf61RxCnt++;
			g_tmGf6Log.formatted.index.id = 0x61;
			break;
		
		case TM_GF6_2_OPCODE:
			g_pTmCommSts->wGf6RxCnt++;
			g_pTmCommSts->wGf62RxCnt++;
			g_tmGf6Log.formatted.index.id = 0x62;
			break;
		
		case TM_GF6_3_OPCODE:
			g_pTmCommSts->wGf6RxCnt++;
			g_pTmCommSts->wGf63RxCnt++;
			g_tmGf6Log.formatted.index.id = 0x63;
			break;
		
		case TM_GF6_4_OPCODE:
			g_pTmCommSts->wGf6RxCnt++;
			g_pTmCommSts->wGf64RxCnt++;
			g_tmGf6Log.formatted.index.id = 0x64;
			break;
			
		case TM_GF6_5_OPCODE:
			g_pTmCommSts->wGf6RxCnt++;
			g_pTmCommSts->wGf65RxCnt++;
			g_tmGf6Log.formatted.index.id = 0x65;
			break;
			
		default:
			g_pTmCommSts->wGf60pCodeErrCnt++;
			break;
	}
	
	g_tmGf6Log.formatted.ticklog = tickGet();
	PostLogSendCmdEx(LOG_SEND_TX, (const char *)(&g_tmGf6Log),
					 sizeof(TM_TYPE_GF5) + OFFSET(LOG_DATA, formatted.body));
}

LOCAL void handleSdlcGf7(void) {
	tmSwapGf7();
	
	switch (g_pTmGf7->m_NAV_RESP & 0xFF00) {
		case TM_TCS_INS_RESP_CODE_GF7_2;
			g_pTmCommSts->wGf7RxCnt++;
			g_pTmCommSts->wGf72RxCnt++;
			break;
			
		case TM_TCS_INS_RESP_CODE_GF7_3;
			g_pTmCommSts->wGf7RxCnt++;
			g_pTmCommSts->wGf73RxCnt++;
			break;
			
		case TM_TCS_INS_RESP_CODE_GF7_4;
			g_pTmCommSts->wGf7RxCnt++;
			g_pTmCommSts->wGf74RxCnt++;
			break;
		
		case TM_TCS_INS_RESP_CODE_GF7_5;
			g_pTmCommSts->wGf7RxCnt++;
			g_pTmCommSts->wGf75RxCnt++;
			break;
			
		case TM_TCS_INS_RESP_CODE_GF7_6;
			g_pTmCommSts->wGf7RxCnt++;
			g_pTmCommSts->wGf76RxCnt++;
			break;
			
		case TM_TCS_INS_RESP_CODE_GF7_7;
			g_pTmCommSts->wGf7RxCnt++;
			g_pTmCommSts->wGf77RxCnt++;
			break;
			
		case TM_TCS_INS_RESP_CODE_GF7_8;
			g_pTmCommSts->wGf7RxCnt++;
			g_pTmCommSts->wGf78RxCnt++;
			break;
			
		case TM_TCS_INS_RESP_CODE_GF7_9;
			g_pTmCommSts->wGf7RxCnt++;
			g_pTmCommSts->wGf79RxCnt++;
			break;
		
		default:
			g_pTmCommSts->wGf7OpCodeErrCnt++;
			break;
	}
	
	g_tmGf7Log.formatted.tickLog = tickGet();
	g_tmGf7Log.formatted.index.id = 0x70;
	PostLogSendCmdEx(LOG_SEND_TX, (const char *)(&g_tmGf7Log),
					 sizeof(TM_TYPE_GF7) + OFFSET(LOG_DATA, formatted.body));
	if (calcNavData() == OK) {
		g_monNavLog.formatted.tickLog = tickGet();
		PostLogSendCmdEx(LOG_SEND_TX, (const char *)(&g_monNavLog),
						 sizeof(MonitoringNavLog) + OFFSET(LOG_DATA, formatted.body));
	}
}

LOCAL void handleSdlcGf8(void) {
	tmSwapGf8();
	
	g_pTmCommSts->wGf8RxCnt++;
	
	g_tmGf8Log.formatted.tickLog = tickGet();
	g_tmGf8Log.formatted.index.id = 0x80;
	PostLogSendCmdEx(LOG_SEND_TX, (const char *)(&g_tmGf8Log),
					 sizeof(TM_TYPE_GF8) + OFFSET(LOG_DATA, formatted.body));
}

LOCAL void handleSdlcGf9(void) {
	tmSwapGf9();
	
	g_pTmCommSts->wGf9RxCnt++;
	
	g_tmGf9Log.formatted.tickLog = tickGet();
	g_tmGf9Log.formatted.index.id = 0x90;
	PostLogSendCmdEx(LOG_SEND_TX, (const char *)(&g_tmGf9Log),
					 sizeof(TM_TYPE_GF9) + OFFSET(LOG_DATA, formatted.body));
}

LOCAL void handleSdlcGf11(void) {
	tmSwapGf11();
	
	g_pTmCommSts->wGf11RxCnt++;
	
	g_tmGf11Log.formatted.tickLog = tickGet();
	g_tmGf11Log.formatted.index.id = 0xB0;
	PostLogSendCmdEx(LOG_SEND_TX, (const char *)(&g_tmGf11Log),
					 sizeof(TM_TYPE_GF11) + OFFSET(LOG_DATA, formatted.body));
}

LOCAL void handleSdlcGf12(void) {
	tmSwapGf12();
	
	g_pTmCommSts->wGf12RxCnt++;
	
	g_tmGf12Log.formatted.tickLog = tickGet();
	g_tmGf12Log.formatted.index.id = 0xC0;
	PostLogSendCmdEx(LOG_SEND_TX, (const char *)(&g_tmGf12Log),
					 sizeof(TM_TYPE_GF12) + OFFSET(LOG_DATA, formatted.body));
}

LOCAL int mtsCheckRange(double dLowerLimit, double dUpperLimit, double dMeasure) {
	int resultType = 0;
	if ((dMeasure >= dLowerLimit) && (dMeasure <= dUpperLimit)) {
		resultType = RESULT_TYPE_PASS;
	} else {
		resultType = RESULT_TYPE_FAIL;
	}
	
	return resultType;
}

LOCAL STATUS calcNavData(void) {
	double latTemp, lonTemp, htTemp;
	
	if ((g_pTmGf7->m_NAV_STS & 0xF) == 0x4) {
		g_pMonNav->flightTime = g_pTmGf7->m_MODE_TIME;
	} else {
		return ERROR;
	}
	
	if (g_pMonNav->flightTime < 61) {
		g_pMonNav->ve60 = (double)(g_pTmGf7->m_AVE * 0.000025);
		g_pMonNav->vn60 = (double)(g_pTmGf7->m_AVN * 0.000025);
		g_pMonNav->vu60 = (double)(g_pTmGf7->m_AVU * 0.000025);
		
		latTemp = fabs(((double)g_pTmGf7->m_ALAT) * 0.000000083819031754);
		g_pMonNav->errLat60 = (fabs(g_pTmFg3->fg3_1.mXLATL) - latTemp) * 111180;
		
		lonTemp = fabs(((double)g_pTmGf7->m_ALON) * 0.000000083819031754);
		g_pMonNav->errLon60 = (fabs(g_pTmFg3->fg3_1.mXLONL) - lonTemp) * 89165;
		
		htTemp = fabs(((double)g_pTmGf7->m_AHEIGHT) * 0.005);
		g_pMonNav->errHt60 = (fabs(g_pTmFg3->fg3_1.m_HL) - htTemp);
		
		g_pMonNav->sts60.bit.ve = RESULT_TYPE_ONGOING;
		g_pMonNav->sts60.bit.vn = RESULT_TYPE_ONGOING;
		g_pMonNav->sts60.bit.vu = RESULT_TYPE_ONGOING;
		
		g_pMonNav->sts60.bit.errLat = RESULT_TYPE_ONGOING;
		g_pMonNav->sts60.bit.errLon = RESULT_TYPE_ONGOING;
		g_pMonNav->sts60.bit.errHt = RESULT_TYPE_ONGOING;
	} else if (g_pMonNav->flightTime == 61) {
		g_pMonNav->sts60.bit.ve = mtsCheckRange(-NAV_VE_TOLERANCE, NAV_VE_TOLERANCE, g_pMonNav->ve60);
		g_pMonNav->sts60.bit.vn = mtsCheckRange(-NAV_VN_TOLERANCE, NAV_VN_TOLERANCE, g_pMonNav->vn60);
		g_pMonNav->sts60.bit.vu = mtsCheckRange(-NAV_VU_TOLERANCE, NAV_VU_TOLERANCE, g_pMonNav->vu60);
		
		g_pMonNav->sts60.bit.errLat = mtsCheckRange(-NAV_ALAT_TOLERANCE, NAV_ALAT_TOLERANCE, g_pMonNav->errLat60);
		g_pMonNav->sts60.bit.errLon = mtsCheckRange(-NAV_ALONG_TOLERANCE, NAV_ALONG_TOLERANCE, g_pMonNav->errLon60);
		g_pMonNav->sts60.bit.errHt = mtsCheckRange(-NAV_AHEIGHT_TOLERANCE, NAV_AHEIGHT_TOLERANCE, g_pMonNav->errHt60);
	} else if (g_pMonNav->flightTime > 61 && g_pMonNav->flightTime < 181) {
		g_pMonNav->ve180 = (double)(g_pTmGf7->m_AVE * 0.000025);
		g_pMonNav->vn180 = (double)(g_pTmGf7->m_AVN * 0.000025);
		g_pMonNav->vu180 = (double)(g_pTmGf7->m_AVU * 0.000025);
		
		latTemp = fabs(((double)g_pTmGf7->m_ALAT) * 0.000000083819031754);
		g_pMonNav->errLat180 = (fabs(g_pTmFg3->fg3_1.m_XLATL) - latTemp) * 111180;
		
		lonTemp = fabs(((double)g_pTmGf7->m_ALON) * 0.000000083819031754);
		g_pMonNav->errLon180 = (fabs(g_pTmFg3->fg3_1.m_XLONL) - lonTemp) * 89165;
		
		htTemp =  fabs(((double)g_pTmGf7->m_AHEIGHT) * 0.005);
		g_pMonNav->errHt180 = (fabs(g_pTmFg3->fg3_1.m_HL) - htTemp);
		
		g_pMonNav->sts180.bit.ve = RESULT_TYPE_ONGOING;
		g_pMonNav->sts180.bit.vn = RESULT_TYPE_ONGOING;
		g_pMonNav->sts180.bit.vu = RESULT_TYPE_ONGOING;
		
		g_pMonNav->sts180.bit.errLat = RESULT_TYPE_ONGOING;
		g_pMonNav->sts180.bit.errLon = RESULT_TYPE_ONGOING;
		g_pMonNav->sts180.bit.errHt = RESULT_TYPE_ONGOING;
	} else if (g_pMonNav->flightTime == 181) {
		g_pMonNav->sts180.bit.ve = mtsCheckRange(-NAV_VE_TOLERANCE, NAV_VE_TOLERANCE, g_pMonNav->ve180);
		g_pMonNav->sts180.bit.vn = mtsCheckRange(-NAV_VN_TOLERANCE, NAV_VN_TOLERANCE, g_pMonNav->vn180);
		g_pMonNav->sts180.bit.vu = mtsCheckRange(-NAV_VU_TOLERANCE, NAV_VU_TOLERANCE, g_pMonNav->vu180);
		
		g_pMonNav->sts180.bit.errLat = mtsCheckRange(-NAV_ALAT_TOLERANCE, NAV_ALAT_TOLERANCE, g_pMonNav->errLat180);
		g_pMonNav->sts180.bit.errLon = mtsCheckRange(-NAV_ALONG_TOLERANCE, NAV_ALONG_TOLERANCE, g_pMonNav->errLon180);
		g_pMonNav->sts180.bit.errHt = mtsCheckRange(-NAV_AHEIGHT_TOLERANCE, NAV_AHEIGHT_TOLERANCE, g_pMonNav->errHt180);
	} else if (g_pMonNav->flightTime > 181 && g_pMonNav->flightTime < 301) {
		g_pMonNav->ve300 = (double)(g_pTmGf7->m_AVE * 0.000025);
		g_pMonNav->vn300 = (double)(g_pTmGf7->m_AVN * 0.000025);
		g_pMonNav->vu300 = (double)(g_pTmGf7->m_AVU * 0.000025);
		
		latTemp = fabs(((double)g_pTmGf7->m_ALAT) * 0.000000083819031754);
		g_pMonNav->errLat300 = (fabs(g_pTmFg3->fg3_1.m_XLATL) - latTemp) * 111180;
		
		lonTemp = fabs(((double)g_pTmGf7->m_ALON) * 0.000000083819031754);
		g_pMonNav->errLon300 = (fabs(g_pTmFg3->fg3_1.m_XLATL) - lonTemp) * 89165;
		
		htTemp = fabs(((double)g_pTmGf7->m_AHEIGHT) * 0.0H);
		g_pMonNav->errHt300 = (fabs(g_pTmFg3->fg3_1.m_HL) - htTemp);
		
		g_pMonNav->sts300.bit.ve = RESULT_TYPE_ONGOING;
		g_pMonNav->sts300.bit.vn = RESULT_TYPE_ONGOING;
		g_pMonNav->sts300.bit.vu = RESULT_TYPE_ONGOING;
		
		g_pMonNav->sts300.bit.errLat = RESULT_TYPE_ONGOING;
		g_pMonNav->sts300.bit.errLon = RESULT_TYPE_ONGOING;
		g_pMonNav->sts300.bit.errHt = RESULT_TYPE_ONGOING;
	} else if (g_pMonNav->flightTime == 301) {
		g_pMonNav->sts300.bit.ve = mtsCheckRange(-NAV_VE_TOLERANCE, NAV_VE_TOLERANCE, g_pMonNav->ve300);
		g_pMonNav->sts300.bit.vn = mtsCheckRange(-NAV_VN_TOLERANCE, NAV_VN_TOLERANCE, g_pMonNav->vn300);
		g_pMonNav->sts300.bit.vu = mtsCheckRange(-NAV_VU_TOLERANCE, NAV_VU_TOLERANCE, g_pMonNav->vu300);
		
		g_pMonNav->sts300.bit.errLat = mtsCheckRange(-NAV_ALAT_TOLERANCE, NAV_ALAT_TOLERANCE, g_pMonNav->errLat300);
		g_pMonNav->sts300.bit.errLon = mtsCheckRange(-NAV_ALONG_TOLERANCE, NAV_ALONG_TOLERANCE, g_pMonNav->errLon300);
		g_pMonNav->sts300.bit.errHt = mtsCheckRange(-NAV_AHEIGHT_TOLERANCE, NAV_AHEIGHT_TOLERANCE, g_pMonNav->errHt300);
	} else {
		return ERROR;
	}
	
	return OK;
}

void SdlcRecvGcuMain(ModuleInst *pModuleInst) {
	SdlcRecvGcuInst *this = (SdlcRecvGcuInst *)pModuleInst;
	
	if (InitSdlcRecvGcu(this) == ERROR) {
		LOGMSG("InitSdlcRecvGcu() error!\n");
	} else if (ExecuteSdlcRecvGcu(this) == ERROR) {
		LOGMSG("ExecuteSdlcRecvGcu() error!!\n");
	}
	if (FinalizeSdlcRecvGcu(this) == ERROR) {
		LOGMSG("FinalizeSdlcRecvGcu() error!!\n");
	}
}
