
# Build the tar from the dev sources
cd ../packaging
mkdir esa-webclient-dev-ngeo
rsync -r --exclude=.svn ../client ./esa-webclient-dev-ngeo/webclient-dev
rsync -r --exclude=.svn ../build ./esa-webclient-dev-ngeo/webclient-dev
tar czf esa-webclient-dev-ngeo.tar.gz esa-webclient-dev-ngeo
rm -rf esa-webclient-dev-ngeo
mv esa-webclient-dev-ngeo.tar.gz ~/rpmbuild/SOURCES

# Build the rpm
rpmbuild -ba esa-webclient-dev-ngeo.spec

