%define ver 0.8.11
%define rel 1
%define jobs 2

Name: nodejs
Version: %{ver}
Release: %{rel}
Summary: Node's goal is to provide an easy way to build scalable network programs.
Group: Applications/Internet
License: Copyright Joyent, Inc. and other Node contributors.
URL: http://nodejs.org
Source0: http://nodejs.org/dist/node-v%{version}.tar.gz
BuildRoot: %{_tmppath}/%{name}-%{version}-%{release}-root-%(%{__id_u} -n)

BuildRequires: python >= 2.4

%description
Node.js is a server-side JavaScript environment that uses an asynchronous
event-driven model. This allows Node.js to get excellent performance based on
the architectures of many Internet applications.

%prep
%setup -q -n node-v%{version}

%build
export JOBS=%{jobs}
./configure --prefix=/usr
make CFLAGS+=-O2 CXXFLAGS+=-O2

%install
rm -rf %{buildroot}
make install DESTDIR=%{buildroot} CFLAGS+=-O2 CXXFLAGS+=-O2

%clean
rm -rf %{buildroot}

%files
%defattr(-,root,root,-)
%doc AUTHORS ChangeLog LICENSE README.md

     /usr/bin/node
     /usr/bin/npm
     /usr/bin/node-waf
     /usr/include/node
     /usr/lib/node
     /usr/lib/node_modules
     /usr/lib/dtrace
     /usr/share/man/man1/node.1.gz

%changelog
* Thu Jul 19 2012 Jørn A. Myrland <j@myrland.nu> 0.8.2-1
- Update spec to use v0.8.2

* Fri Jan 06 2012 Sean Plaice <splaice@gmail.com> 0.6.6-1
- Update spec to use v0.6.6

* Thu Apr 14 2011 Chris Abernethy <cabernet@chrisabernethy.com> 0.4.6-1
- Initial rpm using upstream v0.4.6
