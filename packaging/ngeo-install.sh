#!/bin/sh -e
##############################################################################
# @copyright GMV 2013. Property of GMV; all rights reserved
# @original Author: GMV
# @maintained by: Telespazion France SAS
# @project NGEO T4
# @version $Rev:  $
# @date $LastChangedDate: 2013-09-02 14:20:00 +0200 (lun, 2 Sep 2013) $
# @purpose This script installs/uninstalls an NGEO WEBC subsystem 
# 
# Usage:
# - Installation: ./ngeo-install.sh install
# - Uninstallation: ./ngeo-install.sh uninstall
# - Installation status: ./ngeo-install.sh status
# 
##############################################################################

# ----------------------------------------------------------------------------
# Configuration section
# ----------------------------------------------------------------------------

# Subsystem name
SUBSYSTEM="WEBC"

# ----------------------------------------------------------------------------
# End of configuration section
# ----------------------------------------------------------------------------

# ----------------------------------------------------------------------------
# Install
# ----------------------------------------------------------------------------
ngeo_install() {  

    echo "------------------------------------------------------------------------------"
    echo " NGEO $SUBSYSTEM Install"
    echo "------------------------------------------------------------------------------"  

    # --------------------------------------------------------------------------
    # Install Step 0: Uninstall previous version if any
    # --------------------------------------------------------------------------
    if rpm --quiet -q esa-webclient-ngeo; then
    echo "------------------------------------------------------------------------------" 
    echo "Step 0: Uninstall previous version " 
    echo "------------------------------------------------------------------------------" 
	ngeo_uninstall
    fi

    # --------------------------------------------------------------------------
    # Step 1/4: Software prerequisites                                           
    # --------------------------------------------------------------------------
    echo "------------------------------------------------------------------------------" 
    echo "Step 1/4: Software prerequisites " 
    echo "------------------------------------------------------------------------------" 
	# Nothing to do !
    # --------------------------------------------------------------------------
    # Step 3/4: NGEO Component Installation and configuration
    # --------------------------------------------------------------------------
    echo "------------------------------------------------------------------------------" 
    echo "Step 3/4: NGEO Component Installation " 
    echo "------------------------------------------------------------------------------" 
	yum install -y httpd
	rpm -Uvh esa-webclient-ngeo-VERSION-RELEASE.noarch.rpm
	
    # --------------------------------------------------------------------------
    # Step 4/4: NGEO Component Configuration as Service 
    # --------------------------------------------------------------------------
    echo "------------------------------------------------------------------------------" 
    echo "Step 4/4: NGEO Component Configuration as Service " 
    echo "------------------------------------------------------------------------------" 
    \cp ngeo /etc/init.d  
    chkconfig --level 235 ngeo on 

    echo "------------------------------------------------------------------------------" 
    echo "NGEO $SUBSYSTEM Installed. PLEASE REBOOT the machine to finish. " 
    echo "------------------------------------------------------------------------------" 
}

# ----------------------------------------------------------------------------
# Uninstall
# ----------------------------------------------------------------------------
ngeo_uninstall() {
    # --------------------------------------------------------------------------
	# Step 1/4: Uninstall NGEO Component Configuration as Service 
    # --------------------------------------------------------------------------
    echo "------------------------------------------------------------------------------" 
    echo "Step 1/4: Uninstall NGEO Component Configuration as Service. " 
    echo "------------------------------------------------------------------------------" 
	echo "Stop NGEO service"
	if [ -f /etc/init.d/ngeo ] ; then
		/etc/init.d/ngeo stop
	
		echo "Delete NGEO service"
		rm -f /etc/init.d/ngeo
	fi
	
    # --------------------------------------------------------------------------
    # Step 2/4: Uninstall NGEO Component
    # --------------------------------------------------------------------------
    echo "------------------------------------------------------------------------------" 
    echo "Step 2/4: Uninstall NGEO Component " 
    echo "------------------------------------------------------------------------------" 

    echo "Delete client RPM"
    rpm -e esa-webclient-ngeo
    
    # --------------------------------------------------------------------------
    # Step 3/4: Uninstall OSS/COTS
    # --------------------------------------------------------------------------
    echo "------------------------------------------------------------------------------" 
    echo "Step 3/4: Uninstall OSS/COTS " 
    echo "------------------------------------------------------------------------------" 
	# Nothing to do !
	
    # --------------------------------------------------------------------------
    # Step 4/4: Uninstall Prerequisites
    # --------------------------------------------------------------------------
    echo "------------------------------------------------------------------------------" 
    echo "Step 4/4: Uninstall Prerequisites" 
    echo "------------------------------------------------------------------------------" 
	# Nothing to do !
}

# ----------------------------------------------------------------------------
# Status (check status of a specific RPM)
# ----------------------------------------------------------------------------
ngeo_check_rpm_status () {
    STATUS=`rpm -qa | grep $1`
    if [ -n ${STATUS} ] ; then
        echo -e "$1: \033[1;32minstalled\033[m\017" 
    else
        echo "$1: \033[1;31mmissing\033[m\017"
    fi
}

# ----------------------------------------------------------------------------
# Status
# ----------------------------------------------------------------------------
ngeo_status() {
    echo "------------------------------------------------------------------------------"
    echo " NGEO $SUBSYSTEM Installation Status"
    echo "------------------------------------------------------------------------------"
    ngeo_check_rpm_status esa-webclient-ngeo
}

# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------
case "$1" in
install)
    ngeo_install
;;
uninstall)
    echo "------------------------------------------------------------------------------"
    echo " NGEO $SUBSYSTEM Uninstall"
    echo "------------------------------------------------------------------------------"
    ngeo_uninstall
;;
status)
    ngeo_status
;;
*)
    echo "Usage: $0 {install|uninstall|status}"
exit 1
;;
esac

# END ########################################################################
