// src/app/test-middleware/page.tsx
export default function TestMiddlewarePage() {
    console.log("TEST MIDDLEWARE PAGE SERVER COMPONENT RENDER");
    return (
      <div>
        <h1>Middleware Test Sayfası</h1>
        <p>Eğer bu sayfayı görüyorsan, middleware bu yola yönlendirme yapmadı.</p>
      </div>
    );
  }