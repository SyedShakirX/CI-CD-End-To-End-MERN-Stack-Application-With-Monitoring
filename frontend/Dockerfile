FROM nginx:stable-alpine

#Removing default nginx files
RUN rm -rf /usr/share/nginx/html/*

#Copying website files
COPY index.html styles.css app.js /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]