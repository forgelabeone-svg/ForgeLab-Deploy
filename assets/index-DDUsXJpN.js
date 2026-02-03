(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))s(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const o of t.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function i(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function s(e){if(e.ep)return;e.ep=!0;const t=i(e);fetch(e.href,t)}})();document.querySelector("#app").innerHTML=`
  <div class="text-center space-y-6">
    <h1 class="text-4xl font-bold text-blue-600 mb-4">Hello Vite + Tailwind!</h1>
    <div class="bg-white p-8 rounded-xl shadow-lg max-w-md mx-auto">
      <p class="text-lg text-gray-700 mb-4">
        Your project is ready for development.
      </p>
      <button class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200">
        Get Started
      </button>
    </div>
    <p class="text-sm text-gray-500 mt-8">
      Edit <code class="bg-gray-200 px-2 py-1 rounded text-red-500">src/main.js</code> to see changes
    </p>
  </div>
`;
