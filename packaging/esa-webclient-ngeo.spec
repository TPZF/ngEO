Name:           esa-webclient-ngeo
Version:        0.5
Release:        SNAPSHOT20130301
Summary:        The ngEO Web Client

Group:       	NGEO   
License:     	2013, ESA   
BuildArch: 	noarch
Source0:  	esa-webclient-ngeo.tar.gz
Requires:  	httpd     

%description


%prep
%setup -n esa-webclient-ngeo

%build
%install
install -m 0755 -d $RPM_BUILD_ROOT/usr/local/ngeo
mv webclient/ $RPM_BUILD_ROOT/usr/local/ngeo

%clean
rm -rf $RPM_BUILD_ROOT

%files
%defattr(-,root,root)
/usr/local/ngeo/webclient

%changelog
