import React, { useState } from 'react';
import logo from "../images/flowswitch-logo.png";
import { MdMenu } from 'react-icons/md';
import { FaCamera } from 'react-icons/fa';
import { default as RightDrawer } from "./rightDrawer";
import { useNoteSnap } from '../noteSnapProvider';

const Header = ({ showCard, hideCard, visibleCards }) => {
    const { startNoteVerification } = useNoteSnap();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="sticky bg-gradient-to-r from-white to-lime-600 text-white p-4 px-[5%] relative border-b border-b-lime-600">
            <div className="flex justify-between items-center">
                <div className="flex items-center">
                    <img src={logo} alt="Logo" className="h-10 mr-5" />
                </div>
                <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-4">
                    <button 
                        onClick={() => startNoteVerification({})} 
                        className="text-white hover:text-lime-200"
                    >
                        <FaCamera size={30} />
                    </button>
                    <button 
                        onClick={() => setMenuOpen(!menuOpen)} 
                        className="text-white"
                    >
                        <MdMenu size={30} />
                    </button>
                </div>
            </div>
            <RightDrawer 
                showCard={showCard} 
                hideCard={hideCard} 
                visibleCards={visibleCards} 
                menuOpen={menuOpen} 
                setMenuOpen={setMenuOpen} 
            />
        </header>
    );
};

export default Header;