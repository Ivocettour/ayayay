# CTI Furniture Shop (Firebase SPA)

Tienda simple de **muebles** con catálogo público y **panel admin** protegido por email+clave.
- Público: grid de productos (imagen, precio, materiales, dimensiones).
- Admin: crear/editar/eliminar productos y **subir imágenes** (Firebase Storage).
- **Autenticación**: Email/Password. Usá el **password: 45508227** para el admin.
  > Tenés que crear manualmente el usuario admin en Firebase Auth y poner ese password.

## 1. Requisitos
- Node.js 18+
- Firebase CLI: `npm i -g firebase-tools`

## 2. Crear proyecto y servicios
1) Firebase Console → Crear proyecto.
2) Habilitar **Authentication** → Email/Password.
3) Habilitar **Firestore** (modo producción).
4) Habilitar **Storage**.

## 3. Crear usuario admin
- Authentication → Users → **Add user**.
- Email: `admin@cti-muebles.com` (o el que prefieras)
- Password: `45508227` (la clave que pidió el usuario).

> Si usás otro email, cambiá **también** ese email en `firestore.rules`, `storage.rules` y en `public/app.js` (`ADMIN_EMAIL`).

## 4. Configurar SDK y admin en el código
- En Firebase Console → Project settings → **Your apps** → **Config**: copia `firebaseConfig`.
- En `public/app.js`, reemplazá el objeto `firebaseConfig` con tus valores.
- (Opcional) Cambiá `ADMIN_EMAIL` si no usás `admin@cti-muebles.com`.

## 5. Reglas de seguridad
```bash
firebase login
firebase use -a your-project-id
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

## 6. Probar localmente y desplegar Hosting
```bash
firebase emulators:start --only hosting
firebase deploy --only hosting
```
URL final: `https://<project-id>.web.app`.

## 7. Panel admin
- Botón **“Admin”** (arriba a la derecha).
- Email del admin y **clave 45508227**.
- Crear producto, subir imagen, editar o eliminar.

## 8. Estructura de cada producto (Firestore)
```
{
  title, price, category, dimensions, materials, finish, stock,
  imageURL, imagePath, createdAt, updatedAt
}
```
