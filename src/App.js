import React, { useEffect, useState } from 'react';
import "./index.css";
import MerchantsRegistrationForm from './components/merchantsRegistrationForm';
import VerificationsDashboard from './components/verificationsDashboard';
import AgentRegistrationForm from './components/agentsRegistrationForm';
import MerchantRegistrationTriggerButton from "./components/merchantRegistrationTriggerButton"
import AgentList from "./components/agentsList";
import MerchantList from "./components/merchantsList";
import Header from './components/header';
import Footer from './components/footer';
import CompanyLogo from './images/flowswitch-icon.png';
import { useUserLoginMutation } from './backend/api/sharedCrud';
import { UserLocationProvider } from './userLocationProvider';
import { NoteSnapProvider } from './noteSnapProvider';
import { AgentRegistrationProvider } from './agentRegistrationProvider';
import { AgentVerificationSchedulingProvider } from './agentVerificationScheduleProvider';
import { MerchantRegistrationProvider } from './merchantRegistrationProvider';

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
      visible: false,
      component: AgentRegistrationForm
    },
    agentListTable: {
      key: "agentListTable",
      visible: (user?.agentGuid? false : true),
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
      <MerchantRegistrationProvider>
      <AgentRegistrationProvider user={user}>
        <AgentVerificationSchedulingProvider>
          <div className="flex flex-col min-h-screen bg-gray-100 relative">
            {!isLoggedIn && (
              <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50">
                <div className="bg-white p-8 rounded-md shadow-lg max-w-sm w-full relative text-center">
                  <img src={CompanyLogo} alt="Company Logo" className="mx-auto mb-4 h-16" />
                  <h2 className="text-xl font-semibold mb-4"> Merchant Authentication </h2>

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
                  <MerchantRegistrationTriggerButton />
                </div>
              </div>
            )}

            <Header showCard={showCard} hideCard={hideCard} visibleCards={visibleCards} />
            {user?.agentGuid ?
              <div className="flex bg-lime-100 w-full flex-grow">
                {/* do nothing, agent should not see anything but just wait for their prompt(s) */}
              </div>
              :user ?
              <div className="flex bg-lime-100 min-h-200 w-full flex-grow flex-col xl:flex-row">
                <VerificationsDashboard className={"w-full xl:w-[60%]"} />
                <div className="w-full xl:w-[40%] bg-white py-2 px-1">
                  <div className="w-full">
                      {Object.values(cards).filter(card => card.visible).map(card => {
                        const CardComponent = card.component;
                        return (<CardComponent key={card.key} />);
                      })}
                  </div>
                </div>
              </div>
              :
              <div className="bg-lime-100 min-h-200 w-full">
                <h2 className="text-xl font-semibold mb-4 text-center p-10"> Login pending ... </h2>
                <img src={CompanyLogo} alt="Company Logo" className="mx-auto mb-4 h-16" />
              </div>
            }
            <Footer />
          </div>
          </AgentVerificationSchedulingProvider>
        </AgentRegistrationProvider>
        </MerchantRegistrationProvider>
      </NoteSnapProvider>
    </UserLocationProvider>
  );
};

export default App;