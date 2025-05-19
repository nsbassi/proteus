FROM centos:7

RUN sed -i \
    -e 's|^mirrorlist=|#mirrorlist=|g' \
    -e 's|^#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' \
    /etc/yum.repos.d/CentOS-*.repo

# Install required system packages
RUN yum -y update && \
    yum -y groupinstall "Development Tools" && \
    yum -y install \
    gcc \
    zlib-devel \
    bzip2 \
    bzip2-devel \
    readline-devel \
    sqlite \
    sqlite-devel \
    wget \
    curl \
    xz \
    xz-devel \
    openssl-devel \
    libffi-devel \
    make \
    which

# Download and install Python 3.6.8
RUN cd /opt && \
    curl -O https://www.python.org/ftp/python/3.6.8/Python-3.6.8.tgz && \
    tar xzf Python-3.6.8.tgz && \
    cd Python-3.6.8 && \
    ./configure --enable-optimizations --enable-shared && \
    make -j$(nproc) && \
    make altinstall && \
    ln -s /usr/local/lib/libpython3.6m.so.1.0 /usr/lib/libpython3.6m.so.1.0

RUN echo "/usr/local/lib" >> /etc/ld.so.conf.d/python3.6.conf && ldconfig

# Install pip and PyInstaller
RUN /usr/local/bin/python3.6 -m ensurepip && \
    /usr/local/bin/python3.6 -m pip install --upgrade pip && \
    /usr/local/bin/python3.6 -m pip install pyinstaller

# Set working directory and copy your project
WORKDIR /app
# COPY . /app

# COPY requirements.txt /app/
# RUN /usr/local/bin/python3.6 -m pip install -r requirements.txt

# Build your Python app (change app.py to your entry-point script)
# RUN /usr/local/bin/pyinstaller --onefile --name proteus --add-data "static:static" app.py

CMD ["/bin/bash"]