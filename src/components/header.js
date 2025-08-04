import React, { useState } from 'react';
import logo from "../images/flowswitch-logo.png";
import { MdMenu } from 'react-icons/md';
import { default as RightDrawer } from "./rightDrawer"

const Header = ({ showCard, hideCard, visibleCards }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="sticky bg-gradient-to-r from-white to-lime-600 text-white p-4 px-[5%] relative border-b border-b-lime-600">
            <div className="flex justify-between items-center">
                <div className="flex items-center">
                    <img src={logo} alt="Logo" className="h-10 mr-5" />
                </div>

                <button onClick={() => setMenuOpen(!menuOpen)} className="text-white">
                    <MdMenu size={30} />
                </button>
            </div>

            <RightDrawer showCard={showCard} hideCard={hideCard} visibleCards={visibleCards} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        </header>
    );
};

export default Header;
