import vygCirclarLogo from "../images/flowswitch-icon.png";
import { MdClose } from 'react-icons/md';

const RightDrawer = ({ showCard, hideCard, visibleCards, menuOpen, setMenuOpen }) => {

  return (
    <div
      className={`fixed top-0 right-0 h-full min-w-160 bg-white text-black z-100
      transform transition-transform duration-300 ease-in-out
      shadow-[inset_10px_0_10px_-10px_rgba(0,0,0,0.2)]
      ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="flex justify-between p-4 mb-4">
        <img src={vygCirclarLogo} alt="Logo" className="h-10 mr-5" />
        <button onClick={() => setMenuOpen(!menuOpen)}>
          <MdClose size={24} />
        </button>
      </div>
      <div className="flex flex-col items-start px-6 space-y-3">
        {[
          // { key: 'verificationsDashboard', label: 'Verifications' },
          // { key: 'merchantRegistrationForm', label: 'Merchant Registration' },
          // { key: 'merchantListTable', label: 'Merchants List' },
          { key: 'agentListTable', label: 'Agents List' },
          // { key: 'agentRegistrationForm', label: 'Agent Registration' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center space-x-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={visibleCards[key]}
              onChange={() => {
                if (visibleCards[key]) {
                  hideCard(key)
                } else {
                  showCard(key)
                }
              }}
              className="form-checkbox text-blue-600 accent-blue-600 h-5 w-5"
            />
            <span className="text-blue-600 font-semibold group-hover:underline"
              onClick={() => {
                if (visibleCards[key]) {
                  hideCard(key)
                } else {
                  showCard(key)
                }
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RightDrawer;
