%define	version %(echo $WEBC_VERSION)
%define	release %(echo $WEBC_RELEASE)

Name:           esa-webclient-testserver-ngeo
Version:        %version
Release:        %release
Summary:        The ngEO Web Client Test Server

Group:       	NGEO   
License:     	2013, ESA   
BuildArch: 	noarch
Source0:  	esa-webclient-testserver-ngeo.tar.gz
Requires:  	nodejs     

%description


%prep
%setup -n esa-webclient-testserver-ngeo

%build
%install
install -m 0755 -d $RPM_BUILD_ROOT/usr/local/ngeo
mv webclient-testserver/ $RPM_BUILD_ROOT/usr/local/ngeo

%clean
rm -rf $RPM_BUILD_ROOT

%files
%defattr(-,root,root)
/usr/local/ngeo/webclient-testserver

%changelog
