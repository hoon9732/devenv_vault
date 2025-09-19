#define DEBUG_MSG

#include <taskLib.h>
#include <sysLib.h>
#include <symLib.h>
#include <sysSymTbl.h>
#include <string.h>
#include <errnoLib.h>
#include <usrLib.h>
#include <rebootLib.h>
#include <usrFsLib.h>

#include "../lib/util/isDebug.h"
#include "../lib/util/isUtil.h"
#include "../lib/util/isProfile.h"
#include "../lib/mtsLibPsCtrl.h"
#include "../lib/mtsLib.h"
#include "../lib/steLib.h"
#include "../test/SdlcSendTest.h"
#include "../test/SdlcRecvTest.h"
#include "typeDef/opsType.h"
#include "CmdFuncs.h"
#include "CmdExec.h"
#include "UdpSendOps.h"
#include "SdlcRecvGcu.h"
#include "SdlcSendGcu.h"
#include "SimHotStart.h"
#include "UdpSendLar.h"
#include "UdpRecvLar.h"
#include "Monitoring.h"
#include "LogSend.h"
#include "UdpSendLar.h"
#include "UdpSendRs1.h"
#include "UdpRecvRs1.h"
#include "UdpRecvRs4.h"

#define GCU_RESPONSE_TIME		(200)
#define LAR_RESPONSE_TIME 		(200)
#define CHK_DBL_TOLERANCE		(0.0000000001)
#define	PWR_SUPPLY_MAX_VOLT		(150.0)
#define PWR_SUPPLY_MAX_AMP		(18.0)
#define GCU_IMG_BUFF_LENGTH		(0x00280000)
#define RDC_DATA_BUFF_LENGTH	(0x00300000)
#define DATA_BLOCK_SIZE			(0x00020000)
#define	GCU_IMG_FILE			NET_DEV_REPO_NAME "/GCU.bin"
#define RDC_DATA_FILE			NET_DEV_REPO_NAME "/RDC.bin"

#define HOTSTART_TIMEOUT		(3000)
#define SQUIB_PULSE_DURATION	(100)
#define LNS_BOOT_TIMEOUT		(5000)
#define LNS_CMD_RESPONSE_TIME	(200)
#define LNS_TL_RESPONSE_TIME	(5000)
#define LNS_LF2_RESPONSE_TIME	(200)

#define MTS_VIP_FILE			NET_DEV_REPO_NAME "/vxWorks"

#define REPORT_ERROR(fmt, args...)
	do {
		LOGMSG(fmt, ##args);
		UdpSendOpsTxResult(RESULT_TYPE_FAIL, "ERROR");
	} while (0)
		
#define SET_RESULT_VALUE(fmt, args...)
	do {
		snprintf(g_szResultValue, sizeof(g_szResultValue),
				fmt, ##args);
	} while (0)

#define TRY_STR_TO_LONG(dst, argIdx, casting)
	do {
		dst = (casting)strtol(g_szArgs[argIdx], &g_endptr, 0);
		if ((g_endptr == g_szArgs[argIdx]) || (errno != 0)) {
			REPORT_ERROR("Invalid Argument. [#%d(%s)]\n",
						argIdx, g_szArgs[argIdx]);
			return ERROR;
		}
	} while (0)

#define WAIT_RESPONSE_MASK(numTrial, tickPoll, refVal, targetVal, targetVar, chkMask, resultVar)
	do {
		int waitLoopIdx;
		for (waitLoopIdx = 0; waitLoopIdx < (numTrial); waitLoopIdx++) {
			taskDelay((tickPoll));
			targetVar = (targetVal);
			resultVar = mtsCheckEqual((refVal), targetVar & (chkMask));
			if (resultVar == RESULT_TYPE_PASS) {
				break;
			}
		}
	} while (0)
		
#define WAIT_RESPONSE(numTrial, tickPoll, refVal, targetVal, targetVar, resultVar)
	WAIT_RESPONSE_MASK(numTrial, tickPoll, refVal, targetVal, targetVar, 0xFF00, resultVar)
#define WAIT_LNS_RESPONSE(numTrial, tickPoll, refVal, targetVal, targetVar, resultVar)
	WAIT_RESPONSE_MASK(numTrial, tickPoll, refVal, targetVal, targetVar, 0xFFFFFFFF, resultVar)
#define GET_BIT(field, pos)		(((field) >> (pos)) & 0x1)

typedef struct {
	double	latL;
	double 	lonL;
	double	altL;
	double	latT;
	double	lonT;
	double	altT;
	double	laX;
	double	laY;
	double	laZ;
	double	aqqc1;
	double	aqqc2;
	double	aqqc3;
	double	aqqc4;
} ARGS_NAV_DATA;

typedef struct {
	double	aqqc1;
	double	aqqc2;
	double	aqqc3;
	double	aqqc4;
} VALUE_EX_QUATERNION;

LOCAL char *g_endptr = NULL;

LOCAL char g_szResultValue[80] = {0, };

LOCAL int g_nGcuImgTotalBytes;
LOCAL char g_pGcuImgBuf[GCU_IMG_BUFF_LENGTH];
LOCAL int g_nRdcDataTotalBytes;
LOCAL char g_pRdcDataBuf[GCU_IMG_BUFF_LENGTH];

LOCAL int mtsCheckEqual(int nReference, int nMeasure);
LOCAL int mtsCheckRange(double dLowerLimit, double dUpperLimit, double dMeasure);
LOCAL int mtsCheckDouble(double reference, double measure, double tolerance);

LOCAL int mtsMakeChecksum(void *pBuf, UINT32 dwLen);
LOCAL int mtsCalProgress(int x, int y);

LOCAL STATUS mtsTbatSqbOn(void);
LOCAL STATUS mtsCbatSqbOn(void);
LOCAL STATUS mtsBatSqbOn(void);
LOCAL STATUS mtsAbatSqbOn(void);

LOCAL FUNCPTR findFunc(char *name, SYMTAB_ID symTbl);

LOCAL int mtsCheckEqual(int nReferencee, int nMeasure) {
	int resultType = 0;
	
	if (nReference == nMeasure) {
		resultType = RESULT_TYPE_PASS;
	} else {
		resultType = RESULT_TYPE_FAIL;
	}
	
	return resultType;
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

LOCAL int mtsCheckDouble(double reference, double measure, double tolerance) {
	int resultType = 0;
	
	if (tolerance == 0)
		tolerance = CHK_DBL_TOLERANCE;
	
	if ((measure >= (reference - tolerance)) && (measure <= (reference + tolerance))) {
		resultType = RESULT_TYPE_PASS;
	} else {
		resultType = RESULT_TYPE_FAIL;
	}
	
	return resultType;
}

LOCAL int mtsMakeChecksum(void *pBuf, UINT32 dwLen) {
	int i;
	int checksum;
	int *imageint = (int *)pBu
	
	checksum = 0;
	
	for (i = 0; i < dwLen; i += 4) {
		checksum += *imageint++;
	}
	
	return checksum;
}

LOCAL int mtsCalProgress(int x, int y) {
	return (x * 100) / y;
}
	

LOCAL STATUS mtsTbatSqbOn(void) {
	if (steLibDoSqbTbatSqb(1) == ERROR) {
		REPORT_ERROR("steLibDoSqbTbatSqb(1) Error.\n");
		return ERROR:
	}
	
	LOGMSG("TBAT Squib, ON.\n");
	
	DELAY_MS(SQUIB_PULSE_DURATION);
	
	if (steLibDoSqbTbatSqb(0) == ERROR) {
		REPORT_ERROR("steLibDoSqbSbatSqb(0) Error.\n");
		return ERROR;
	}
	
	LOGMSG("CBAT Squib, OFF.\n");
	
	return OK;
}

LOCAL STATUS mtsBatSqbOn(void) {
	if (steLibDoSqbBat1Sqb1(1) == ERROR) {
		REPORT_ERROR("steLibDoSqbBat1Sqb(1) Error.\n");
		return ERROR;
	}
	
	LOGMSG("BAT1 Squib1, ON.\n");
	
	if (steLibDoSqbBat2Sqb1(1) == ERROR) {
		REPORT_ERROR("steLibDoSqbBat2Sqb1(1) Error. \n");
		return ERROR;
	}
	
	LOGMSG("BAT2 Squib1, ON.\n");
	
	DELAY_MS(SQUIB_PULSE_DURATION);
	
	if (steLibDoSqbBat1Sqb1(0) == ERROR) {
		REPORT_ERROR("steLibDoSqbBat1Sqb1(0) Error. \n");
		return ERROR;
	}
	
	LOGMSG("BAT1 Squib1, OFF.\n");
	
	if (steLibDoSqbBat2Sqb1(0) == ERROR) {
		REPORT_ERROR("steLibDoSqbBat2Sqb1(0) Error.\n");
		return ERROR;
	}
	
	LOGMSG("BAT2 Squib1, OFF.\n");
	
	return OK;
}

LOCAL STATUS mtsAbatSqbOn(voO(1) == ERROR) {
		REPORT_ERROR("steLibDoSqbAbat1Sqb1(1) Error.\n");
		return ERROR;
	}
	
	LOGMSG("ABAT1 Squib1, ON.\n");
	
	if (steLibDoSqbAbat1Sqb2(1) == ERROR) {
		REPORT_ERROR("steLibDoSqbAbat1Sqb2(1) Error.\n");
		return ERROR;
		
	LOGMSG("ABAT1 Squib2, ON.\n");
	
	DELAY_MS(SQUIB_PULSE_DURATION);
	
	if (steLibDoSqbAbat1Sqb1(0) == ERROR) {
		REPORT_ERROR("steLibDoSqbAbat1Sqb1(0) Error.\n");
		return ERROR;
	}
	
	LOGMSG("ABAT1 Squib1, OFF.\n");
	
	if (steLibDoSqbAbat1Sqb2(0) == ERROR) {
		REPORT_ERROR("steLibDoSqbAbat1Sqb2(0) Error.\n");
		return ERROR;
	}
	
	LOGMSG("ABAT1 Squib2, OFF.\n");
	
	return OK;
}

LOCAL FUNCPTR findFunc(char *name, SYMTAB_ID symTbl) {
	SYMBOL_DESC symDesc;
	
	if (name == NULL) {
		return NULL;
	}
	
	memset(&symDesc, 0, sizeof(SYMBOL_DESC));
	
	symDesc.mask = SYM_FIND_BY_NAME;
	symDesc.name = name;
	
	if (symTbl == NULL) {
		symTbl = sysSymTbl;
	}
	
	if (symFind(symTbl, &symDesc) == ERROR) {
		LOGMSG("Cannot find \"%s\"...\n", name);
		printErrno(errnoGet());
		
		return NULL;
	}
	
	if (SYM_IS_TEXT(symDesc.type) == 0) {
		LOGMSG("\"%s\" is not in .text...!\n", name);
		
		return NULL;
	}
	
	return (FUNCPTR)symDesc.value;
}

STATUS mtsTestFunc(void) {
	LOGMSG("Start...!\n");
	
	int i = 10;
	for (; i > 0; i--) {
		taskDelay(sysClkRateGet());
		LOGMSG("Cnt = %d\n", i);
	}
	
	LOGMSG("End...!\n");
	
	UdpSendOpsTxResult(RESULT_TYPE_PASS, "OK");
	
	return OK;
}

STATUS invokeMethod_uint(void) {
	FUNCPTR pfnFunc;
	unsigned int uArg;
	
	TRY_STR_TO_LONG(uArg, 1, unsigned int);
	
	if ((pfnFunc = findFunc(g_szArgs[0], NULL)) == NULL) {
		UdpSendOpsTxResult(RESULT_TYPE_FAIL, "ERROR");
		
		return ERROR;
	}
	
	pfnFunc(uArg);
	
	UdpSendOpsTxResult(RESULT_TYPE_PASS, "OK");
	
	return OK;
}

STATUS invokeMethod_uint_double(void) {
	FUNCPTR pfnFunc;
	unsigned int uArg;
	double dArg;
	
	TRY_STR_TO_LONG(uArg, 1, unsigned int);
	TRY_STR_TO_DOUBLE(dArg, 2);
	
	if ((pfnFunc = findFunc(g_szArgs[0], NULL)) == NULL) {
		UdpSendOpsTxResult(RESULT_TYPE_FAIL, "ERROR");
		
		return ERROR;
	}
	
	pfnFunc(uArg, dArg);
	
	UdpSendOpsTxResult(RESULT_TYPE_PASS, "OK");
	
	return OK;
}

STATUS checkResult equal(void) {
	FUNCPTR pfnFunc;
	UINT32 funcRet;
	unsigned int refVal;
	OPS_TYPE_RESULT_TYPE eResult;
	
	TRY_STR_TO_LONG(refVal, 1, unsigned int);
	
	if ((pfnFunc = findFunc(g_szArgs[0], NULL)) == NULL) {
		UdpSendOpsTxResult(RESULT_TYPE_FAIL, "ERROR");
		
		return ERROR;
	}
	
	funcRet = pfnFunc();
	
	eResult = mtsCheckEqual(refVal, funcRet);
	UdpSendOpsTxResult(eResult, "0x%X", funcRet);
	
	return OK;
}

STATUS checkResult_range(void) {
	DBLFUNCPTR pfnFunc;
	double funcRet;
	double refMin, refMax;
	OPS_TYPE_RESULT_TYPE eResult;
	
	TRY_STR_TO_DOUBLE(refMin, 1);
	TRY_STR_TO_DOUBLE(refMax, 2);
	
	if ((pfnFunc = (DBLFUNCPTR)findFunc(g_szArgs[0], NULL)) == NULL) {
		UdpSendOpsTxResult(RESULT_TYPE_FAIL, "ERROR");
		
		return ERROR;
	}
	
	funcRet = pfnFunc();
	
	eResult = mtsCheckRange(refMin, refMax, funcRet);
	UdpSendOpsTxResult(eResult, "%0.3lf", funcRet);
	
	return OK;
}

STATUS mtsCommTestTxReq(void) {
	unsigned int uCh;
	
	TRY_STR_TO_LONG(uCh, 0, unsigned int);
	
	switch (uCh) {
		case LOG_SEND_INDEX_ID_COMM_TEST_MTE:
			SdlcSendTextTx(g_szArgs[1]);
			break;
		default:
			REPORT_ERROR("Invalid Argument. [#%d(%s)]\n", 0, g_szArgs[0]);
			return ERROR;
	}
	
	return OK;
}

STATUS mtsCommTest(void) {
	unsigned int Uch;
	
	TRY_STR_TO_LONG(uCh, 0, unsigned int);
	
	switch (uCh) {
		case LOG_SEND_INDEX_ID_COMM_TEST_MTE;
		SdlSendTestTx(g_szArgs[1]));
		break;
		default:
			REPORT_ERROR("Invalid Argument. [#%d(%s)]\n", 0, g_szArgs[0]);
			return ERROR;
	}
	
	DELAY_MS(20);
	
	if (strncmp(g_szArgs[1], g_pSdlcRecvTestBuf, sizeof(g_szArgs[1])) == 0) {
		UdpSendOpsTxResult(RESULT_TYPE_PASS, "OK");
	} else {
		UdpSendOpsTxResult(RESULT_TYPE_FAIL, "ERROR");
	}
	
	return OK;
}

STATUS mtsReset(void)
{
	mtsLibPsSetOutput(0);
	
	DELAY_MS(100);
	
	reboot(BOOT_CLEAR | BOOT_QUICK_AUTOBOOT);
	
	return OK;
}

STATUS mtsUpdate(void) {
	if (cp(MTS_VIP_FILE, "/mmc1") == ERROR) {
		REPORT_ERROR("cp(%s to %s) Error.\n", MTS_VIP_FILE, "/mmc1");
		return ERROR;
	}
	
	UdpSendOpsTxResult(RESULT_TYPE_PASS, "OK");
	
	return OK;
}

STATUS mtsPowerExtOn(void) {
	if (strcmp(g_szArgs[0], "MSL_EXT") == 0) {
		if (mtsLibDoSysPwrMslExtEn(1) == ERROR) {
			REPORT_ERROR("mtsLibDoSysPwrMslExtEn(1) Error.\n");
			return ERROR;
		}
		
		LOGMSG("MSL_EXT, ON.\n");
		
	} else if (strcmp(g_szArgs[0], "TLM_EXT") == 0) {
		if (mtsLibDoSysPwrTlmExtEn(1) == ERROR) {
			REPORT_ERROR("mtsLibDoSysPwrTlmExtEn(1) Error.\n");
			return ERROR;
		}
		
		LOGMSG("TLM_EXT, ON.\n");
		
		DELAY_SEC(0.5);
		
		if (mtsLibDoSysPwrCluExtEn(1) == ERROR) {
			REPORT_ERROR("mtsLibDoSysPwrCluExtEn(1) Error.\n");
			return ERROR;
		}
		
		LOGMSG("CLU_EXT, ON.\n");
		
	} else if (strcmp(g_szArgs[0], "LNS") == 0) {
		if (steLibDoSysPwrLnsEn(1) == ERROR) {
			REPORT_ERROR("steLibDoSysPwrLnsEn(1) Error.\n");
			return ERROR;
		}
		
		LOGMSG("LNS Power, ON.\n");
	
	} else if (strcmp(g_szArgs[0], "LAR") == 0) {
		if (steLibDoSysPwrLarEn(1) == ERROR) {
			REPORT_ERROR("steLibDoSysPwrLarEn(1) Error.\n");
			return ERROR;
		}
		
		LOGMSG("LAR Power, ON.\n");
		
	} else {
		REPORT_ERROR("Invalid Argument. [#%d(%s)]\n", 0, g_szArgs[0]);
		return ERROR;
	}
	
	UdpSendnOpsTxResult(RESULT_TYPE_PASS, "OK");
	
	return OK;
}

STATUS mtsPowerExtOff(void) {
	if (strcmp(g_szArgs[0], "MSL_EXT") == 0) {
		if (mtsLibDoSysPwrMslExtEn(0) == ERROR) {
			REPORT_ERROR("mtsLibDoSysPwrMslExtEn(0) Error.\n");
			return ERROR;
		}
		
		LOGMSG("MSL_EXT, OFF.\n");
		
	} else if (strcmp(g_szArgs[0], "TLM_EXT") == 0) {
		if (mtsLibDoSysPwrTlmExtEn(0) == ERROR) {
			REPORT_ERROR("mtsLibDoSysPwrTlmExtEn(0) Error.\n");
			return ERROR;
		}
		
		LOGMSG("TLM_EXT, OFF.\n");
		
		DELAY_SEC(0.5);
		
		if (mtsLibDoSysPwrCluExtEn(0) == ERROR) {
			REPORT_ERROR("mtsLibDoSysPwrCluExtEn(0) Error.\n");
			return ERROR;
		}
		
		LOGMSG("CLU_EXT, OFF.\n");
	
	} else if (strcmp(g_szArgs[0], "LNS") == 0) {
		if (steLibDoSysPwrLnsEn(0) == ERROR) {
			REPORT_ERROR("steLibDoSysPwrLnsEn(0) Error.\n");
			return ERROR;
		}
		
		LOGMSG("LNS Power, OFF.\n");
		
	} else if (strcmp(g_szArgs[0], "LAR") == 0) {
		if (steLibDoSysPwrLarEn(0) == ERROR) {
			REPORT_ERROR("steLibDoSysPwrLarEn(0) Error.\n");
			return ERROR;
		}
		
		LOGMSG("LAR Power, OFF.\n");
		
	} else {
		REPORT_ERROR("Invalid Argument. [#%d(%s)]\n", 0, g_szArgs[0]);