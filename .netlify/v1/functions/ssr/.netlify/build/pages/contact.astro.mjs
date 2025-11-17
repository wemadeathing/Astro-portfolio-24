import { c as createComponent, b as renderTemplate, r as renderComponent, m as maybeRenderHead, d as addAttribute } from '../chunks/astro/server_BmSrm4w3.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_XexBz5M9.mjs';
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Contact = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate(_a || (_a = __template(["", " <script>\n  const form = document.getElementById('contact-form');\n  const formStatus = document.getElementById('formStatus');\n  const errorMessage = formStatus?.querySelector('.error');\n  const successMessage = formStatus?.querySelector('.success');\n  const loadingMessage = formStatus?.querySelector('.loading');\n  const submitButton = document.getElementById('submitButton');\n\n  form.addEventListener('submit', function(e) {\n    e.preventDefault();\n    \n    // Show loading state\n    if (submitButton) submitButton.disabled = true;\n    if (formStatus) formStatus.classList.remove('hidden');\n    if (errorMessage) errorMessage.classList.add('hidden');\n    if (successMessage) successMessage.classList.add('hidden');\n    if (loadingMessage) loadingMessage.classList.remove('hidden');\n\n    const formData = new FormData(form);\n    const object = Object.fromEntries(formData);\n    const json = JSON.stringify(object);\n\n    fetch('https://api.web3forms.com/submit', {\n      method: 'POST',\n      headers: {\n        'Content-Type': 'application/json',\n        'Accept': 'application/json'\n      },\n      body: json\n    })\n    .then(async (response) => {\n      const json = await response.json();\n      if (response.status == 200) {\n        // Redirect to thank you page\n        window.location.href = '/thank-you';\n      } else {\n        if (loadingMessage) loadingMessage.classList.add('hidden');\n        if (errorMessage) errorMessage.classList.remove('hidden');\n      }\n    })\n    .catch(error => {\n      console.error('Form submission error:', error);\n      if (loadingMessage) loadingMessage.classList.add('hidden');\n      if (errorMessage) errorMessage.classList.remove('hidden');\n    })\n    .finally(() => {\n      if (submitButton) submitButton.disabled = false;\n      form.reset();\n    });\n  });\n</script>"])), renderComponent($$result, "Layout", $$Layout, { "title": "Contact | Get in Touch" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32"> <div class="max-w-2xl mx-auto"> <h1 class="text-4xl font-bold mb-6 text-foreground">Get in Touch</h1> <p class="text-xl text-muted-foreground mb-12">
Have a project in mind? Let's discuss how we can work together to bring your ideas to life.
</p> <form id="contact-form" class="space-y-4" method="POST"> <!-- Add the Web3Forms access key --> <input type="hidden" name="access_key"${addAttribute("e5755c19-dbc1-40ab-8046-ba18c652fabb", "value")}> <!-- Keep your existing form fields --> <div> <label for="name" class="block text-sm font-medium text-foreground mb-2">
Name
</label> <input type="text" id="name" name="name" class="w-full rounded-lg bg-secondary/50 border border-primary/20 px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors" required> </div> <div> <label for="email" class="block text-sm font-medium text-foreground mb-2">
Email
</label> <input type="email" id="email" name="email" class="w-full rounded-lg bg-secondary/50 border border-primary/20 px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors" required> </div> <div> <label for="message" class="block text-sm font-medium text-foreground mb-2">
Message
</label> <textarea id="message" name="message" rows="6" class="w-full rounded-lg bg-secondary/50 border border-primary/20 px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors" required></textarea> </div> <div id="formStatus" class="hidden text-sm"> <p class="error hidden text-destructive">There was an error sending your message. Please try again.</p> <p class="success hidden text-green-500">Message sent successfully!</p> <p class="loading hidden text-blue-500">Sending message...</p> </div> <button type="submit" id="submitButton" class="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-black transition-colors hover:bg-white/90">
Send Message
</button> </form> </div> </div> ` }));
}, "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/contact.astro", void 0);
const $$file = "/Users/nasifsalaam/Documents/GitHub/Astro-portfolio-24/src/pages/contact.astro";
const $$url = "/contact";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Contact,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
