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
		dst = (casting)strtol(g_szArgs[argIdx], &g_endptr