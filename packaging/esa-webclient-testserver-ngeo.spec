Name:           esa-webclient-testserver-ngeo
Version:        0.4
Release:        SNAPSHOT20130208
Summary:        The ngEO Web Client Test Server

Group:       	NGEO   
License:     	2012, ESA   
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
