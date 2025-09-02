import React, { useState, useRef, useEffect } from 'react';
import { useMerchantRegistration } from "../merchantRegistrationProvider";

const MerchantRegistrationTriggerButton = ({ }) => {

    const { triggerMerchantRegistrationPrompt } = useMerchantRegistration()

    return (
        <div className="items-center border-t mt-10">
            <div className="w-[70%] hover:text-blue-600 my-4 p-2 rounded-md mx-auto cursor-pointer" 
                onClick={() => {
                    triggerMerchantRegistrationPrompt({})
                }}
            >
                Signup as a merchant 
            </div>
        </div>
    );
};

export default MerchantRegistrationTriggerButton;