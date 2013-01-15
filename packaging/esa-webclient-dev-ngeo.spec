Name:           esa-webclient-dev-ngeo
Version:        0.3
Release:        SNAPSHOT20121227
Summary:        The ngEO Web Client

Group:       	NGEO   
License:     	2012, ESA   
BuildArch: 	noarch
Source0:  	esa-webclient-dev-ngeo.tar.gz
Requires:  	httpd     

%description


%prep
%setup -n esa-webclient-dev-ngeo

%build
%install
install -m 0755 -d $RPM_BUILD_ROOT/usr/local/ngeo
mv webclient-dev/ $RPM_BUILD_ROOT/usr/local/ngeo

%clean
rm -rf $RPM_BUILD_ROOT

%files
%defattr(-,root,root)
/usr/local/ngeo/webclient-dev

%changelog
