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
	
	UdpSendOpsTxResult(RESULT_TYPE_PASS, "OK");
	
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
		return ERROR;
	}
	
	UdpSendOpsTxResult(RESULT_TYPE_PASS, "OK");
	
	return OK;
}

STATUS mtsPowerExtGd(void) {
	UINT32 dwPwrGd;
	OPS_TYPE_RESULT_TYPE eResult;
	long refVal;
	
	if (strcmp(g_szArgs[0], "TLM_EXT") == 0) {
		dwPwrGd = mtsLibDiBitPwrTlmExtPg();
	} else if (strcmp(g_szArgs[0], "CLU_EXT") == 0) {
		dwPwrGd = mtsLibDiBitPwrCluExtPg();
	} else if (strcmp(g_szArgs[0], "MSL_EXT") == 0) {
		dwPwrGd = mtsLibDiBitPwrMslExtPg();
	} else if (strcmp(g_szArgs[0], "LNS") == 0) {
		dwPwrGd = steLibDiBitPwrLnsPg();
	} else if (strcmp(g_szArgs[0], "LAR") == 0) {
		dwPwrGd = steLibDiBitPwrLarPg();
	} else {
		REPORT_ERROR("Invalid Argument. [#%d(%s)]\n", 0, g_szArgs[0]);
		return ERROR;
	}
	
	TRY_STR_TO_LONG(refVal, 1, int);
	eResult = (refVal == dwPwrGd ? RESULT_TYPE_PASS : RESULT_TYPE_FAIL);
	UdpSendOpsTxResult(eResult, "%d", dwPwrGd);
	
	return OK;
}

STATUS mtsPowerMeasureVolt(void) {
	double dAdcVolt;
	
	OPS_TYPE_RESULT_TYPE eResult;
	double refMin, refMax;
	
	if (strcmp(g_szArgs[0], "TLM_EXT") == 0) {
		dAdcVolt = mtsLibAdcTlmExtVoltage();
	} else if (strcmp(g_szArgs[0], "CLU_EXT") == 0) {
		dAdcVolt = mtsLibAdcCluExtVoltage();
	} else if (strcmp(g_szArgs[0], "MSL_EXT") == 0) {
		dAdcVolt = mtsLibAdcMslExtVoltage();
	} else if (strcmp(g_szArgs[0], "TBAT") == 0) {
		dAdcVolt = steLibAdcTbatVoltage();
	} else if (strcmp(g_szArgs[0], "CBAT") == 0) {
		dAdcVolt = steLibAdcCbatVoltage();
	} else if (strcmp(g_szArgs[0], "BAT") == 0) {
		dAdcVolt = ateLibAdcBatVoltage();
	} else if (strcmp(g_szArgs[0], "LNS") == 0) {
		dAdcVolt = steLibAdcLnsExtVoltage();
	} else if (strcmp(g_szArgs[0], "LAR") == 0) {
		dAdcVolt = steLibAdcLarExtVoltage();
	} else {
		REPORT_ERROR("Invalid Argument. [#%d(%s)]\n", 0, g_szArgs[0]);
		return ERROR;
	}
	
	TRY_STR_TO_DOUBLE(refMin, 1);
	TRY_STR_TO_DOUBLE(refMax, 2);
	eResult = mtsCheck Rangge(refMin, refMax, dAdcVolt);
	UdpSendOpsTxResult(eResult, "%0.3lf", aAdcVolt);
	
	return OK;
}

STATUS mtsPowerMeasureCurrent(void) {
	double dAdcCurrent;
	OPS_TYPE_RESULT_TYPE eResult;
	double refMin, refMax;
	
	if (strcmp(g_szArgs[0], "TLM_EXT") == 0) {
		dAdcCurrent = mtsLibAdcTlmExtCurrent();
	} else if (strcmp(g_szArgs[0], "CLU_EXT") == 0) {
		dAdcCurrent = mtsLibAdcCluExtCurrent();
	} else if (strcmp(g_szArgs[0], "MSL_EXT") == 0) {
		dAdcCurrent = mtsLibAdcMslExtCurrent();
	} else if (strcmp(g_szArgs[0], "TBAT") == 0) {
		dAdcCurrent = steLibAdcTbatCurrent();
	} else if (strcmp(g_szArgs[0], "CBAT") == 0) {
		dAdcCurrent - steLibAdcCbatCurrent();
	} else if (strcmp(g_szArgs[0], "BAT") == 0) {
		dAdcCurrent = steLibAdcBatCurrent();
	} else if (strcmp(g_szArgs[0], "LNS") == 0) {
		dAdcCurrent = steLibAdcLnsExtCurrent();
	} else if (strcmp(g_szArgs[0], "LAR") == 0) {
		dAdcCurrent = steLibAdcLarExtCurrent();
	} else {
		REPORT_ERROR("Invalid Argument. [#%d(%s)]\n", 0, g_szArgs[0]);
		return ERROR;
	}
	
	TRY_STR_TO_DOUBLE(refMin, 1);
	TRY_STR_TO_DOUBLE(refMax, 2);
	eResult = mtsCheckRange(refMin, refMax, dAdcCurrent);
	UdpSendOpsTxResult(eResult, "%0.3lf", dAdcCurrent);
	
	return OK;
}

STATUS mtsInitActPwrSuplOut(void) {
	double dVolt, dCurr;
	
	TRY_STR_TO_DOUBLE(dVolt, 0);
	TRY_STR_TO_DOUBLE(dCurr, 1);
	
	if ((dVolt > PWR_SUPPLY_MAX_VOLT) || (dCurr > PWR_SUPPLY_MAX_AMP)) {
		REPORT_ERROR("Setting Value is Too High.\n");
		return ERROR;
	}
	
#ifdef PWR_SUPPLY_USE_TCP
	if (mtsLibPsTcpInit(dVolt, dCurr) == ERROR) {
		REPORT_ERROR("mtsLibPsTcpInit Failed.\n");
		return ERROR;
	}
#else
	if (mtsLibPsUdpInit(dVolt, dCurr) == ERROR) {
		REPORT_ERROR("mtsLibPsUdpInit Failed.\n");
		return ERROR;
	}
#endif

	UdpSendOpsTxResult(RESULT_TYPE_PASS, "OK");
		
	return OK;
}

STATUS mtsSetActPwrSuplOut(void) {
	int i;
	
	if (mtsLibPsIsReady() == ERROR) {
		REPORT_ERROR("ActPwrSupl is not Initialized.\n");
		return ERROR;
	}
	
	if (strcmp(g_szArgs[0], "ON") == 0) {
		if (mtsAbatSqbOn() == ERROR) {
			REPORT_ERROR("mtsAbatSqbOn() Error.\n");
			return ERROR;
		}
	
		for (i = 0; i < 150; i++) {
			if (((double)(g_pTmGf2->m_ABAT_VTG) * 0.01) >= 100.0)
				break;
			
			DELAY_MS(100);
		}
	} else if (strcmp(g_szaArgs[0], "OFF") == 0) {
		if (mtsLibPsSetOutput(0) == ERROR) {
			REPORT_ERROR("mtsLibPsSetOutput(0) Result is Abnormal.\n");
			return ERROR;
		}
		
		for (i = 0; i < 200; i++) {
			if (((double)(g_pTmGf2->m_ABAT_VTG) * 0.01) < 1.2)
				break;
			
			DELAY_MS(100);
		}
	} else {
		REPORT_ERROR("Invalid Argument. [#%d(%s)]\n", 0, g_szArgs[0]);
		return ERROR;
	}
	
	UdpSendOpsTxResult(RESULT_TYPE_PASS, "OK");
	
	return OK;
}

STATUS mtsSetActPwrSuplOutBit(void) {
	int i;
	
	if (mtsLibPsIsReady() == ERROR) {
		REPORT_ERROR("ActPwrSupl is not Initialized.\n");
		return ERROR;
	}
	
	if (strcmp(g_szArgs[0], "ON") == 0) {
		if (mtsLibPsSetOutput(1) == ERROR) {
			REPORT_ERROR("mtsLibPsSetOutput(1) Result is Abnormal.\n");
			return ERROR;
		}
	} else if (strcmp(g_szArgs[0], "OFF") == 0) {
		if (mtsLibPsSetOutput(0) == ERROR) {
			REPORT_ERROR("mtsLibPsSetOutput(0) Result is Abnormal.\n");
			return ERROR;
		}
		
		for (i = 0; i < 200; i++) {
			if (((double)(g_pTmGf2->m_ABAT_VTG) * 0.01) < 1.2)
				break;
			
			DELAY_MS(100);
		}
	} else {
		REPORT_ERROR("Invalid Argument. [#%d(%s)]\n", 0, g_szArgs[0]);
		return ERROR;
	}
	
	UdpSendOpsTxResult(RESULT_TYPE_PASS, "OK");
	
	return OK;
}

STATUS mtsGetActPwrSuplOut(void) {
	OPS_TYPE_RESULT_TYPE eResult;
	double dValue;
	double refMin, refMax;
	
	TRY_STR_TO_DOUBLE(refMin, 1);
	TRY_STR_TO_DOUBLE(refMax, 2);
	
	if (mtsLibPsIsReady() == ERROR) {
		REPORT_ERROR("ActPwrSupl is not Initialized.\n");
		return ERROR;
	}
	
	if (strcmp(g_szArgs[0], "VOLT") == 0) {
		if (mtsLibPsGetVolt(&dValue) == ERROR) {
			REPORT_ERROR("mtsLibPsGetVolt() Failed.\n");
			return ERROR;
		}
	} else if (strcmp(g_szArgs[0], "AMP") == 0) {
		if (mtsLibPsGetCurr(&dValue) == ERROR) {
			REPORT_ERROR("mtsLibPsGetCurr() Failed.\n");
			return ERROR;
		}
	} else {
		REPORT_ERROR("Invalid Argument. [#%d(%s)]\n", 0, g_szArgs[0]);
		return ERROR;
	}
	
	eResult = mtsCheckRange(refMin, refMax, dValue);
	UdpSendOpsTxResult(eResult, "%0.1lf", dValue);
	
	return OK;
}

STATUS mtsChkGf2(void) {
	OPS_TYPE_RESULT_TYPE eResult;
	long refVal;
	double refMin, refMax;
	double dValue;
	int nValue;
	
	if (strcmp(g_szArgs[0], "GCU_28V") == 0) {
		TRY_STR_TO_DOUBLE(refMin, 1);
		TRY_STR_TO_DOUBLE(refMax, 2);
		
		dValue = (double)(g_pTmGf2->m_GCU_28V) * 0.002;
		eResult = mtsCheckRange(refMin, refMax, dValue);
		UdpSendOpsTxResult(eResult, "%0.3lf", dValue);
		
		return OK;
	} else if (strcmp(g_szArgs[0], "GCU_FAIL") == 0) {
		nValue = GET_BIT(g_pTmGf2->m_MSL_STS, 15);
		eResult = mtsCheckEqual(0x0, nValue);
		UdpSendOpsTxResult(eResult, "%d", nValue);
		
		return OK;
	} else if (strcmp(g_szArgs[0], "ACU_FAIL") == 0) {
		nValue = GET_BIT(g_pTmGf2->m_MSL_STS, 14);
		eResult = mtsCheckEqual(0x0, nValue);
		UdpSendOpsTxResult(eResult, "%d", nValue);
		
		return OK;
	} else if (strcmp(g_szArgs[0], "GPS_FAIL") == 0) {
		nValue = GET_BIT(g_pTmGf2->m_MSL_STS, 13);
		eResult = mtsCheckEqual(0x0, nValue);
		UdpSendOpsTxResult(eResult, "%d", nValue);
		
		return OK;
	} else if (strcmp(g_szArgs[0], "IMU_FAIL") == 0) {
		nValue = GET_BIT(g_pTmGf2->m_MSL_STS, 11);
		eResult = mtsCheckEqual(0x0, nValue);
		UdpSendOpsTxResult(eResult, "%d", nValue);
		
		return OK;
	} else if (strcmp(g_szArgs[0], "FUZ_FAIL") == 0) {
		nValue = GET_BIT(g_pTmGf2->m_MSL_STS, 10);
		eResult = mtsCheckEqual(0x0, nValue);
		UdpSendOpsTxResult(eResult, "%d", nValue);
		
		return OK;
	} else if (strcmp(g_szArgs[0], "PARAM_FAIL") == 0) {
		nValue = GET_BIT(g_pTmGf2->m_MSL_STS, 8);
		eResult = mtsCheckEqual(0x0, nValue);
		UdpSendOpsTxResult(eResult, "%d", nValue);
		
		return OK;
	} else if (strcmp(g_szArgs[0], "ACU_STS") == 0) {
		TRY_STR_TO_LONG(refVal, 1, long);
		
		nValue = g_pTmGf2->m_ACU_STS;
		eResult = mtsCheckEqual(refVal, nValue & g_dwArgMask);
		UdpSendOpsTxResult(eResult, "0x%04X", nValue);
		
		return OK;
	} else if (strcmp(g_szArgs[0], "MSL_STS") == 0) {
		TRY_STR_TO_LONG(refVal, 1, long);
		
		nValue = g_pTmGf2->m_MSL_STS;
		eResult = mtsCheckEqual(refVal, nValue & g_dwArgMask);
		UdpSendOpsTxResult(eResult, "0x%04X", nValue);
		
		return OK;
	} else if (strcmp(g_szArgs[0], "ABAT_VTG") == 0) {
		TRY_STR_TO_DOUBLE(refMin, 1);
		TRY_STR_TO_DOUBLE(refMax, 2);
		
		dValue = (double)(g_pTmGf2->m_ABAT_VTG) * 0.01;
		eResult = mtsCheckRange(refMin, refMax, dValue);
		UdpSendOpsTxResult(eResult, "%0.2lf", dValue);
		
		return OK;
	} else if (strcmp(g_szArgs[0], "BAT1_VTG") == 0) {
		TRY_STR_TO_DOUBLE(refMin, 1);
		TRY_STR_TO_DOUBLE(refMax, 2);
		
		dValue = (double)(g_pTmGf2->m_BAT1_VTG) * 0.002;
		eResult = mtsCheckRange(refMin, refMax, dValue);
		UdpSendOpsTxResult(eResult, "%0.3lf", dValue);
		
		return OK;
	} else if (strcmp(g_szArgs[0], "BAT2_VTG") == 0) {
		TRY_STR_TO_DOUBLE(refMin, 1);
		TRY_STR_TO_DOUBLE(refMax, 2);
		
		dValue = (double)(g_pTmGf2->m_BAT2_VTG) * 0.002;
		eResult = mtsCheckRange(refMin, refMax, dValue);
		UdpSendOpsTxResult(eResult, "%0.3lf", dValue);
		
		return OK;
	} else if (strcmp(g_szArgs[0], "FIN1_FB") == 0) {
		TRY_STR_TO_DOUBLE(refMin, 1);
		TRY_STR_TO_DOUBLE(refMax, 2);
		
		dValue = (double)(g_pTmGf2->m_FIN1_FB) * 0.001;
		eResult = mtsCheckRange(refMin, refMax, dValue);
		UdpSendOpsTxResult(eResult, "%0.3lf", dValue);
		
		return OK;
	} else if (strcmp(g_szArgs[0], "FIN2_FB) == 0) {
		TRY_STR_TO_DOUBLE(refMin, 1);
		TRY_STR_TO_DOUBLE(refMax, 2);
		
		dValue = (double)(g_pTmGf2->m_FIN2_FB) * 0.001;
		eResult = mtsCheckRange(refMin, refMax, dValue);
		UdpSendOpsTxResult(eResult, "%0.3lf", dValue);
		
		return OK;
	} else if (strcmp(g_szArgs[0], "FIN3_FB") == 0) {
		TRY_STR_TO_DOUBLE(refMin, 1);
		TRY_STR_TO_DOUBLE(refMax, 2);
		
		dValue = (double)(g_pTmGf2->m_FIN3_FB) * 0.001;
		eResult = mtsCheckRange(refMin, refMax, dValue);
		UdpSendOpsTxResult(eResult, "%0.3lf", dValue);
		
		return OK;
	} else if (strcmp(g_szArgs[0], "FIN4_FB") == 0) {
		TRY_STR_TO_DOUBLE(refMin, 1);
		TRY_STR_TO_DOUBLE(refMax, 2);
		
		dValue = (double)(g_pTmGf2->m_FIN4_FB) * 0.001;
		eResult = mtsCheckRange(refMin, refMax, dValue);
		UdpSendOpsTxResult(eResult, "%0.3lf", dValue);
		
		return OK;
	} else {
		REPORT_ERROR("Invalid Argument. [#%d(%s)]\n", 0, g_szArgs[0]);
		return ERROR;
	}
}

STATUS mtsGcuMslStsChk(void) {
	OPS_TYPE_RESULT_TYPE eResult;
	CODE usResp;
	
	memset((void *)(g_pTmFg2), 0, sizeof(TM_TYPE_FG2));
	
	g_pTmFg2->fg2_1.m_ADDRESS = TM_SDLC_ADDRESS;
	g_pTmFg2->fg2_1.m_CONTROL = TM_FG2_SDLC_CONTROL;
	g_pTmFg2->fg2_1.m_OPCODE = TM_FG2_1_OPCODE_MSL_COMM_START;
	
	if (PostCmd(g_hSdlcSendGcu, SDLC_SEND_GCU_TX_FG2) == ERROR) {
		REPORT_ERROR("PostCmd(SDLC_SEND_GCU_TX_FG2)\n";
		return ERROR;
	}
	
	WAIT_RESPONSE(GCU_RESPONSE_TIME, 1, TM_FG2_1_OPCODE_MSL_COMM_START, g_pTmGf2->m_GCU_RESP, usResp, eResult);
	
	UdpSendOpsTxResult(eResult, "0x%04X", usResp);
	
	return OK;
}

STATUS mtsSwVerChk(void) {
	int refVal, targetVal;
	OPS_TYPE_RESULT_TYPE eResult;
	CODE usGcuResp;
	
	memset((void *)(g_pTmFg3), 0, sizeof(TM_TYPE_FG3));
	
	g_pTmFg3->fg3_4.m_ADDRESS = TM_SDLC_ADDRESS;
	g_pTmFg3->fg3_4.m_CONTROL = TM_FG3_SDLC_CONTROL;
	g_pTmFg3->fg3_4.m_OPCODE = TM_FG3_4_OPCODE;
	
	if (PostCmd(g_hSdlcSendGcu, SDLC_SEND_GCU_TX_FG3) == ERROR) {
		REPORT_ERROR("PostCmd(SDLC_SEND_GCU_TX_FG3)\n");
		return ERROR;
	}
	
	WAIT_RESPONSE(GCU_RESPONSE_TIME, 1, TM_FG3_4_OPCODE, g_pTmGf3->gf3_4.m_GCU_RESP, usGcuResp, eResult);
	
	if (eResult == RESULT_TYPE_FAIL) {
		REPORT_ERROR("GCU : No Response.\n");
		return ERROR;
	}
	
	if (strcmp(g_szArgs[0], "GCU_SW_VER") == 0) {
		targetVal = g_pTmGf3->gf3_4.m_GCU_SW_VER;
	} else if (strcmp(g_szArgs[0], "GCU_SW_CREATE") == 0) {
		targetVal = g_pTmGf3->gf3_4.m_GCU_SW_CREATE;
	} else if (strcmp(g_szArgs[0], "GCU_FW_VER") == 0) {
		targetVal = g_pTmGf3->gf3_4.m_GCU_FW_VER;
	} else if (strcmp(g_szArgs[0], "GCU_FW_CREATE") == 0 {
		targetVal = g_pTmGf3->gf3_4.m_GCU_FW_CREATE;
	} else if (strcmp(g_szArgs[0], "GCU_SW_VER") == 0 {
		targetVal = g_pTmGf3->gf3_4.m_GCU_SW_VER;
	} else if (strcmp(g_szArgs[0], "GCU_SW_CREATE") == 0 {
		targetVal = g_pTmGf3->gf3_4.m_GCU_SW_CREATE;
	} else if (strcmp(g_szArgs[0], "INS_UPDATE_VER1") == 0 {
		targetVal = g_pTmGf3->gf3_4.m_INS_UPDATE_VER1;
	} else if (strcmp(g_szArgs[0], "INS_UPDATE_VER2") == 0 {
		targetVal = g_pTmGf3->gf3_4.m_INS_UPDATE_VER2;
	} else if (strcmp(g_szArgs[0], "ACU_VER") == 0 {
		targetVal = g_pTmGf3->gf3_4.m_ACU_VER;
	} else if (strcmp(g_szArgs[0], "ACU_UPDATE") == 0 {
		targetVal = g_pTmGf3->gf3_4.m_ACU_UPDATE;
	} else if (strcmp(g_szArgs{[0], "MAR_VER") == 0 {
		targetVal = g_pTmGf3->gf3_4.m_MAR_VER;
	} else if (strcmp(g_szArgs[0], "MAR_UPDATE") == 0 {
		targetVal = g_pTmGf3->gf3_4.m_MAR_UPDATE{;
	} else {
		REPORT_ERROR("Invalid Argument. [#%d(%s)]\n", 0, g_szArgs[0]);
		return ERROR;
	}
	
	if (strcmp(g_szArgs[1], "PASS") == 0) {
		eResult = RESULT_TYPE_PASS;
	} else {
		TRY_STR_TO_LONG(refVal, 1, int);
		eResult = mtsCheckEqual(refVal, targetVal);
	}
	
	UdpSendOpsTxResult(eResult, "0x%04X", targetVal);
	
	return OK;
}

STATUS mtsGcuFireModeStart(void) {
	OPS_TYPE_RESULT_TYPE eResult;
	CODE usGcuResp, usGcuMode;
	
	memset((void *)(g_pTmFg2), 0, sizeof(TM_TYPE_FG2));
	
	g_pTmFg2->fg2_1.m_ADDRESS = TM_SDLC_ADDRESS;
	g_pTmFg2->fg2_1.m_CONTROL = TM_FG2_SDLC_CONTROL;
	g_pTmFg2->fg2_1.m_OPCODE = TM_FG2_1_OPCODE_MODE_LAUNCH;
	
	if (PostCmd(g_hSdlcSendGcu, SDLC_SEND_GCU_TX_FG2) == ERROR) {
		REPORT_ERROR("PostCmd(SDLC_SEND_GCU_TX_FG2)\n");
		return ERROR;
	}
	
	WAIT_RESPONSE(GCU_RESPONSE_TIME, 1, TM_FG2_1_OPCODE_MODE_LAUNCH, g_pTmGf2->m_GCU_RESP, usGcuResp, eResult);
	
	if (eResult == RESULT_TYPE_FAIL) {
		REPORT_ERROR("GCU : No Response.\n");
		return ERROR;
	}
	
	usGcuMode = g_pTmGf2->m_GCU_MODE;
	eResult = mtsCheckEqual(0x1400, usGcuMode & 0xFFF0);
	UdpSendOpsTxResult(eResult, "0x%04X", usGcuMode);
	
	return OK;
}

STATUS mtsNavCal(void) {
	OPS_TYPE_RESULT_TYPE eResult;
	CODE usGcuResp, usGcuMode;
	
	memset((void *)(g_pTmFg2), 0, sizeof(TM_TYPE_FG2));
	
	g_pTmFg2->fg2_1.m_ADDRESS = TM_SDLC_ADDRESS;
	g_pTmFg2->fg2_1.m_CONTROL = TM_FG2_SDLC_CONTROL;
	g_pTmFg2->fg2_1.m_OPCODE = TM_FG2_1_OPCODE_MSL_START_GNC;
	
	if (PostCmd(g_hSdlcSendGcu, SDLC_SEND_GCU_TX_FG2) == ERROR) {
		REPORT_ERROR("PostCmd(SDLC_SEND_GCU_TX_FG2)\n");
		return ERROR;
	}
	
	WAIT_RESPONSE(GCU_RESPONSE_TIME, 1, TM_FG2_1_OPCODE_MSL_START_GNC, g_pTmGf2->m_GCU_RESP, usGcuResp, eResult);
	
	if (eResult == RESULT_TYPE_FAIL) {
		REPORT_ERROR("GCU : No Response.\n");
		return ERROR;
	}
	
	usGcuMode = g_pTmGf2->m_GCU_MODE;
	eResult = mtsCheckEqual(0x1812, usGcuMode);
	
	UdpSendOpsTxResult(eResult, "0x%04X", usGcuMode);
	
	return OK;
}

STATUS mtsNavDataInput(void) {
	STATUS ret = OK;
	
	ARGS_NAV_DATA *pNavData = (ARGS_NAV_DATA *)g_szArgs[0];
	
	memset((void *)(g_pTmFg3), 0, sizeof(TM_TYPE_FG3));
	
	g_pTmFg3->fg3_1.m_ADDRESS = TM_SDLC_ADDRESS;
	g_pTmFg3->fg3_1.m_CONTROL = TM_FG3_SDLC_CONTROL;
	g_pTmFg3->fg3_1.m_OPCODE = TM_FG3_1_OPCODE;
	
	g_pTmFg3->fg3_1.m_XLATL = pNavData->latL;
	g_pTmFg3->fg3_1.m_XLONL = pNavData->lonL;
	g_pTmFg3->fg3_1.m_HL = pNavData->altL;
	g_pTmFg3->fg3_1.m_XLATT = pNavData->latT;
	g_pTmFg3->fg3_1.m_XLONT = pNavData->lonT;
	g_pTmFg3->fg3_1.m_HT = pNavData->altT;
	g_pTmFg3->fg3_1.m_IMU_LA_X = pNavData->laX;
	g_pTmFg3->fg3_1.m_IMU_LA_Y = pNavData->laY;
	g_pTmFg3->fg3_1.m_IMU_LA_Z = pNavData->laZ;
	g_pTmFg3->fg3_1.m_AQQC1 = pNavData->aqqc1;
	g_pTmFg3->fg3_1.m_AQQC2 = pNavData->aqqc2;
	g_pTmFg3->fg3_1.m_AQQC3 = pNavData->aqqc3;
	g_pTmFg3->fg3_1.m_AQQC4 = pNavData->aqqc4;
	
	if (PostCmd(g_hSdlcSendGcu, SDLC_SEND_GCU_TX_FG3) == ERROR) {
		REPORT_ERROR("PostCmd(SDLC_SEND_GCU_TX_FG3)\n");
		return ERROR;
	}
	
	DELAY_MS(GCU_RESPONSE_TIME);
	
	if (mtsCheckDouble(g_pTmFg3->fg3_1.m_XLATL, g_pTmGf3->gf3_1.m_XLATL, 0) == RESULT_TYPE_FAIL) {
		LOGMSG("XLATL Data Mismatch.\n FG3: %0.10f\n GF3: %0.10f \n",
				g_pTmFg3->fg3_1.m_XLATL, g_pTmGf3->gf3_1.m_XLATL);
		ret = ERROR;
	}
	if (mtsCheckDouble(g_pTmFg3->fg3_1.m_XLONL, g_pTmGf3->gf3_1.m_XLONL, 0) == RESULT_TYPE_FAIL) {
		LOGMSG("XLONL Data Mismatch.\n FG3: %0.10f\n GF3: %0.10f \n",
				g_pTmFg3->fg3_1.m_XLONL, g_pTmGf3->gf3_1.m_XLONL);
		ret = ERROR;
	}
	if (mtsCheckDouble(g_pTmFg3->fg3_1.m_HL, g_pTmGf3->gf3_1.m_HL, 0) == RESULT_TYPE_FAIL) {
		LOGMSG("HL Data Mismatch.\n FG3: %0.10f\n GF3: %0.10f \n",
				g_pTmFg3->fg3_1.m_HL, g_pTmGf3->gf3_1.m_HL);
		ret = ERROR;
	}
	if (mtsCheckDouble(g_pTmFg3->fg3_1.m_XLATT, g_pTmGf3->gf3_1.m_XLATT, 0) == RESULT_TYPE_FAIL) {
		LOGMSG("XLATT Data Mismatch.\n FG3: %0.10f\n GF3: %0.10f \n",
				g_pTmFg3->fg3_1.m_XLATT, g_pTmGf3->gf3_1.m_HL);
		ret = ERROR;
	}
	if (mtsCheckDouble(g_pTmFg3->fg3_1.m_XLONT, g_pTmGf3->gf3_1.m_XLONT, 0) == RESULT_TYPE_FAIL) {
		LOGMSG("XLONT Data Mismatch.\n FG3: %0.10f\n GF3: %0.10f \n",
				g_pTmFg3->fg3_1.m_XLONT, g_pTmGf3->gf3_1.m_XLONT);
		ret = ERROR;
	}
	
	if (mtsCheckDouble(g_pTmFg3->fg3_1.m_HT, g_pTmGf3->gf3_1.m_HT, 0) == RESULT_TYPE_FAIL) {
		LOGMSG("HT Data Mismatch.\n FG3: %0.10f\n GF3: %0.10f \n",
				g_pTmFg3->fg3_1.m_HT, g_pTmGf3->gf3_1.m_HT);
		ret = ERROR;
	}
	
	if (mtsCheckDouble(g_pTmFg3->fg3_1.m_AQQC1, g_pTmGf3->gf3_1.m_AQQC1, 0) == RESULT_TYPE_FAIL) {
		LOGMSG("AQQC1 Data Mismatch.\n FG3: %0.10f\n GF3: %0.10f \n",
				g_pTmFg3->fg3_1.m_AQQC1, g_pTmGf3->gf3_1.m_AQQC1);
		ret = ERROR;
	}
	if (mtsCheckDouble(g_pTmFg3->fg3_1.m_AQQC2, g_pTmGf3->gf3_1.m_AQQC2, 0) == RESULT_TYPE_FAIL) {
		LOGMSG("AQQC2 Data Mismatch.\n FG3: %0.10f\n GF3: %0.10f \n",
				g_pTmFg3->fg3_1.m_AQQC2, g_pTmGf3->gf3_1.m_AQQC2);
		ret = ERROR;
	}
	if (mtsCheckDouble(g_pTmFg3->fg3_1.m_AQQC3, g_pTmGf3->gf3_1.m_AQQC3, 0) == RESULT_TYPE_FAIL) {
		LOGMSG("AQQC3 Data Mismatch.\n FG3: %0.10f\n GF3: %0.10f \n",
				g_pTmFg3->fg3_1.m_AQQC3, g_pTmGf3->gf3_1.m_AQQC3);
		ret = ERROR;
	}
	if (mtsCheckDouble(g_pTmFg3->fg3_1.m_AQQC4, g_pTmGf3->gf3_1.m_AQQC4, 0) == RESULT_TYPE_FAIL) {
		LOGMSG("AQQC4 Data Mismatch.\n FG3: %0.10f\n GF3: %0.10f \n",
				g_pTmFg3->fg3_1.m_AQQC4, g_pTmGf3->gf3_1.m_AQQC4);
		ret = ERROR;
	}
	if (mtsCheckDouble(g_pTmFg3->fg3_1.m_ROLL, g_pTmGf3->gf3_1.m_ROLL, 0) == RESULT_TYPE_FAIL) {
		LOGMSG("ROLL Data Mismatch.\n FG3: %0.10f\n GF3: %0.10f \n",
				g_pTmFg3->fg3_1.m_ROLL, g_pTmGf3->gf3_1.m_ROLL);
		ret = ERROR;
	}
	if (mtsCheckDouble(g_pTmFg3->fg3_1.m_PITCH, g_pTmGf3->gf3_1.m_PITCH, 0) == RESULT_TYPE_FAIL) {
		LOGMSG("PITCH Data Mismatch.\n FG3: %0.10f\n GF3: %0.10f \n",
				g_pTmFg3->fg3_1.m_PITCH, g_pTmGf3->gf3_1.m_PITCH);
		ret = ERROR;
	}
	if (mtsCheckDouble(g_pTmFg3->fg3_1.m_YAW, g_pTmGf3->gf3_1.m_YAW, 0) == RESULT_TYPE_FAIL) {
		LOGMSG("YAW Data Mismatch.\n FG3: %0.10f\n GF3: %0.10f \n",
				g_pTmFg3->fg3_1.m_YAW, g_pTmGf3->gf3_1.m_YAW);
		ret = ERROR;
	}
	if (mtsCheckDouble(g_pTmFg3->fg3_1.m_IMU_LA_X, g_pTmGf3->gf3_1.m_IMU_LA_X, 0) == RESULT_TYPE_FAIL) {
		LOGMSG("IMU_LA_X Data Mismatch.\n FG3: %0.10f\n GF3: %0.10f \n",
				g_pTmFg3->fg3_1.m_IMU_LA_X, g_pTmGf3->gf3_1.m_IMU_LA_X);
		ret = ERROR;
	}
	if (mtsCheckDouble(g_pTmFg3->fg3_1.m_IMU_LA_Y, g_pTmGf3->gf3_1.m_IMU_LA_Y, 0) == RESULT_TYPE_FAIL) {
		LOGMSG("IMU_LA_Y Data Mismatch.\n FG3: %0.10f\n GF3: %0.10f \n",
				g_pTmFg3->fg3_1.m_IMU_LA_Y, g_pTmGf3->gf3_1.m_IMU_LA_Y);
		ret = ERROR;
	}
	if (mtsCheckDouble(g_pTmFg3->fg3_1.m_IMU_LA_Z, g_pTmGf3->gf3_1.m_IMU_LA_Z, 0) == RESULT_TYPE_FAIL) {
		LOGMSG("IMU_LA_Z Data Mismatch.\n FG3: %0.10f\n GF3: %0.10f \n",
				g_pTmFg3->fg3_1.m_IMU_LA_Z, g_pTmGf3->gf3_1.m_IMU_LA_Z);
		ret = ERROR;
	}
	
	if (ret == ERROR) {
		REPORT_ERROR("FG3 and GF3 NavData Mismatch. \n");
	} else {
		UdpSendOpsTxResult(RESULT_TYPE_PASS, "OK");
	}
	
	return ret;
}

STATUS mtsSaveAlignData(void) {
	VALUE_EX_QUATERNION quaternion;
	
	quaternion.aqqc1 = g_pTmGf7->m_AQQC1 * 5.0e-10;
	quaternion.aqqc2 = g_pTmGf7->m_AQQC2 * 5.0e-10;
	quaternion.aqqc3 = g_pTmGf7->m_AQQC3 * 5.0e-10;
	quaternion.aqqc4 = g_pTmGf7->m_AQQC4 * 5.0e-10;
	
	UdpSendOpsTxResultTx(RESULT_TYPE_PASS, &quaternion, sizeof(quaternion), "OK");
	
	return OK;
}

STATUS mtsChkGf3NavData(void) {
	const char * szValueFormat = "%0.5f";
	
	if (strcmp(g_szArgs[0], "XLATL") == 0) {
		UdpSendOpsTxResult(RESULT_TYPE_PASS, szValueFormat, g_pTmGf3->gf3_1.m_XLATL);
		return OK;
	} else if (strcmp(g_szArgs[0], "XLONL") == 0) {
		UdpSendOpsTxResult(RESULT_TYPE_PASS, szValueFormat, g_pTmGf3->gf3_1.m_XLONL);
		return OK;
	} else if (strcmp(g_szArgs[0], "HL") == 0) {
		UdpSendOpsTxResult(RESULT_TYPE_PASS, szValueFormat, g_pTmGf3->gf3_1.m_HL);
		return OK;
	} else if (strcmp(g_szArgs[0], "XLATT") == 0) {
		UdpSendOpsTxResult(RESULT_TYPE_PASS, szValueFormat, g_pTmGf3->gf3_1.m_XLATT);
		return OK;
	} else if (strcmp(g_szArgs[0], "XLONT") == 0) {
		UdpSendOpsTxResult(RESULT_TYPE_PASS, szValueFormat, g_pTmGf3->gf3_1.m_XLONT);
		return OK;
	} else if (strcmp(g_szArgs[0], "HT") == 0) {
		UdpSendOpsTxResult(RESULT_TYPE_PASS, szValueFormat, g_pTmGf3->gf3_1.m_XHT);
		return OK;
	} else if (strcmp(g_szArgs[0], "IMU_LA_X") == 0) {
		UdpSendOpsTxResult(RESULT_TYPE_PASS, szValueFormat, g_pTmGf3->gf3_1.m_IMU_LA_X);
		return OK;