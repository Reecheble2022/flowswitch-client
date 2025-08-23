import React, { useEffect, useState } from 'react';
import "./index.css";
import MerchantsRegistrationForm from './components/merchantsRegistrationForm';
import VerificationsDashboard from './components/verificationsDashboard';
import AgentRegistrationForm from './components/agentsRegistrationForm';
import AgentList from "./components/agentsList";
import MerchantList from "./components/merchantsList";
import Header from './components/header';
import Footer from './components/footer';
import CompanyLogo from './images/flowswitch-icon.png';
import { useUserLoginMutation } from './backend/api/sharedCrud';
import { UserLocationProvider } from './userLocationProvider';
import { NoteSnapProvider } from './noteSnapProvider';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState({
    verificationsDashboard: {
      key: "verificationsDashboard",
      visible: false,
      component: VerificationsDashboard
    },
    merchantRegistrationForm: {
      key: "merchantRegistrationForm",
      visible: false,
      component: MerchantsRegistrationForm
    },
    merchantListTable: {
      key: "merchantListTable",
      visible: false,
      component: MerchantList
    },
    agentRegistrationForm: {
      key: "agentRegistrationForm",
      visible: true,
      component: AgentRegistrationForm
    },
    agentListTable: {
      key: "agentListTable",
      visible: false,
      component: AgentList
    },
  });

  const showCard = (cardKey) => {
    if (cards[cardKey]) {
      setCards((prev) => ({
        ...prev,
        [cardKey]: {
          ...prev[cardKey],
          visible: true
        }
      }));
    }
  };

  const hideCard = (cardKey) => {
    if (cards[cardKey]) {
      setCards((prev) => ({
        ...prev,
        [cardKey]: {
          ...prev[cardKey],
          visible: false
        }
      }));
    }
  };

  let visibleCards = {};
  Object.values(cards).forEach(card => {
    visibleCards[card.key] = card.visible;
  });

  const [submitLoginForm, {
    data: loginSuccessResponse,
    isLoading: loginProcessing,
    isSuccess: loginSucceeded,
    isError: loginFailed,
    error: loginError,
  }] = useUserLoginMutation();

  const {user: userDetails} = loginSuccessResponse || {}
  console.log("userDetails =", userDetails)

  useEffect(() => {
    if (loginSucceeded && userDetails) {
      setIsLoggedIn(true);
      setUser(userDetails);
    }
  }, [loginSucceeded, loginSuccessResponse]);

  const handleLogin = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    submitLoginForm({ data: { email, password } });
  };

  return (
    <UserLocationProvider user={user}>
    <NoteSnapProvider user={user}>
      <div className="flex flex-col min-h-screen bg-gray-100 relative">
        {!isLoggedIn && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-md shadow-lg max-w-sm w-full relative text-center">
              <img src={CompanyLogo} alt="Company Logo" className="mx-auto mb-4 h-16" />
              <h2 className="text-xl font-semibold mb-4"> Login to Continue </h2>

              {loginFailed && (
                <div className="text-red-600 text-sm mb-4">
                  {loginError?.data?.message || 'Invalid credentials. Please try again.'}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="text"
                  placeholder="Username"
                  name="email"
                  className="w-full px-3 py-2 border rounded"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  name="password"
                  className="w-full px-3 py-2 border rounded"
                  required
                />
                <button
                  type="submit"
                  disabled={loginProcessing}
                  className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ${loginProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {loginProcessing ? 'Please wait...' : 'Login'}
                </button>
              </form>
            </div>
          </div>
        )}

        <Header showCard={showCard} hideCard={hideCard} visibleCards={visibleCards} />
        <main className="flex-grow bg-gradient-to-b from-lime-100 to-lime-200 py-8">
          <div className="w-full px-[5%]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {Object.values(cards).filter(card => card.visible).map(card => {
                const CardComponent = card.component;
                return (<CardComponent key={card.key} />);
              })}
            </div>
          </div>
        </main>
        <Footer />
      </div>
      </NoteSnapProvider>
    </UserLocationProvider>
  );
};

export default App;