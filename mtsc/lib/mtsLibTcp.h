#pragma once

#include <vxWorks.h>

IMPORT STATUS mtsLibTcpInitClient(int *pFd, const char *szIpAddr, const int nPort);
