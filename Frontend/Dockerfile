# Etapa de construcción (Build)
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Construir la aplicación React (Vite)
RUN npm run build

# Etapa de producción (Nginx)
FROM nginx:alpine

# Eliminar configuración por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar los archivos construidos desde la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar archivo de configuración personalizado de Nginx (opcional, útil para SPA)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
