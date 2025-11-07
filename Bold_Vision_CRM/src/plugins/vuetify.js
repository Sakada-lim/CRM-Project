// src/plugins/vuetify.js
import 'vuetify/styles';
import { createVuetify } from 'vuetify';

// import all Vuetify components & directives
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

// icon set (Material Design Icons)
import { aliases, mdi } from 'vuetify/iconsets/mdi';

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'light',
  },
});

export default vuetify;

