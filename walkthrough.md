# Artisan Marketplace — Direct Image Upload System

We have replaced manual image URL inputs with **direct photo uploading** on both the **Web Admin Portal** and the **Mobile App**.

---

## 📸 1. Direct Image Upload on Web Admin Portal
Accessible at [`http://localhost:5000/admin`](http://localhost:5000/admin):
- **Drag & Drop / Browse Dropzone**: Click anywhere or drag an image from your PC / Mac / phone browser directly into the upload area.
- **Automatic Server Streaming**: The file is streamed via `POST /api/upload/single` (using `FormData`) and saved to local server storage or Cloudinary.
- **Instant Thumbnail Preview**: Shows a live photo preview, file name, and green status badge (`Uploaded to Server ✓`).
- **One-Click Craft Presets**: Includes 4 ready high-resolution artisan presets (`🏺 Pottery Vase`, `👜 Leather Bag`, `💍 Silver Ring`, `🧣 Woven Scarf`) for instant 1-click selection.

---

## 📱 2. Device Photo & Camera Upload on Mobile App
Accessible in the mobile app under `Profile ➔ Artisan Dashboard ➔ Add New Creation` ([add-product.tsx](file:///c:/Users/ybeka/Music/PROJECT/artisan-marketplace/src/app/seller/add-product.tsx)):
- **Choose from Gallery**: Tap **"Choose from Gallery"** to select any photo from your phone's media library via `expo-image-picker`.
- **Take Photo with Camera**: Tap **"Take Photo"** to take a live photo of a handcrafted creation.
- **Direct Upload**: The mobile app streams the photo buffer directly to the backend (`/api/upload/single`), automatically sets the image URL, and renders a live preview card.
- **Artisan Presets**: Quick tap chips to select pottery, leather, jewelry, or textile preset photos with zero typing.

---

## 🗄️ 3. Backend Resilient Hybrid Storage
In [uploadController.ts](file:///c:/Users/ybeka/Music/PROJECT/artisan-marketplace/backend/src/controllers/uploadController.ts):
- **Local Fallback**: Automatically creates `backend/public/uploads/` and saves uploaded photos locally if Cloudinary credentials are not configured.
- **Dynamic LAN Host URL**: Generates URLs like `http://<YOUR_IP>:5000/uploads/craft-xyz.jpg` so images load on both PC browsers and physical mobile devices over Wi-Fi.

---

## 🚀 Verification
- **TypeScript**: `npx tsc --noEmit` passed with **0 errors**.
- **Backend**: Running healthy at `http://0.0.0.0:5000`.
- **Admin Portal**: Live at `http://localhost:5000/admin`.
- **Mobile Expo**: Live on device.
