import React, { useState } from 'react';

const FloatingLabelInput = ({ label, name, type = "text", required = false, multiline = false, ...props }) => {
    const [value, setValue] = useState("");

    const isFloating = value.length > 0;

    return (
        <div className="relative w-full">
            {multiline ? (
                <textarea
                    name={name}
                    required={required}
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        if(props.onChange){
                            props.onChange(e)
                        }
                    }}
                    rows={4}
                    className="peer w-full text-gray-900 border border-zinc-400 mt-2 placeholder-transparent focus:outline-none focus:border-blue-600 py-2 pl-3 resize-none bg-zinc-100 rounded-xl"
                    placeholder={label}
                />
            ) : (
                <input
                    type={type}
                    name={name}
                    required={required}
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        if(props.onChange){
                            props.onChange(e)
                        }
                    }}
                    className="peer w-full border-b border-gray-300 bg-transparent text-gray-900 placeholder-transparent focus:outline-none focus:border-blue-600 py-2"
                    placeholder={label}
                />
            )}

            <label
                className={`
                    absolute 
                    ${multiline ? 'left-3' : 'left-0'} 
                    ${isFloating ? "-top-2 text-sm text-blue-600" : "top-2 text-base text-gray-400"} 
                    transition-all peer-focus:-top-3 peer-focus:text-sm peer-focus:text-blue-600
                `}
            >
                {label}
            </label>
        </div>
    );
};

export { FloatingLabelInput };
