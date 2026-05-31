# Gunakan Nginx Alpine sebagai base image
FROM nginx:alpine

# Salin konfigurasi Nginx khusus untuk Cloud Run (Port 8080)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Salin semua file projek ke direktori statis Nginx
COPY . /usr/share/nginx/html

# Cloud Run memerlukan port 8080 secara default
EXPOSE 8080

# Jalankan Nginx
CMD ["nginx", "-g", "daemon off;"]
