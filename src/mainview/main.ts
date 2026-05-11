import "@renderer/app.css";
import App from "@renderer/App.vue";
import {createApp} from "vue";
import ArcoVue from '@arco-design/web-vue';
import ArcoVueIcon from '@arco-design/web-vue/es/icon';
import '@arco-design/web-vue/dist/arco.css';
import {router} from "@renderer/scripts/router";

const app = createApp(App);
app.use(router);
app.use(ArcoVue);
app.use(ArcoVueIcon);
app.mount('#app');
