import { AppRouter } from './app/router';
import { AppLanguageBridge } from './i18n/AppLanguageBridge';

function App() {
  return (
    <AppLanguageBridge>
      <AppRouter />
    </AppLanguageBridge>
  );
}

export default App;
