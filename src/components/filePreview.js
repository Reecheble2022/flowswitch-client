import React from 'react';
import { FileText, File, Image } from 'lucide-react';

const FilePreview = ({
    file,
    preview,
    size = 'sm'
}) => {
    
    const sizeClasses = {
        sm: 'w-10 h-10',
        md: 'w-16 h-16',
        lg: 'w-24 h-24'
    };

    const iconSize = {
        sm: 'h-6 w-6',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    const getFileIcon = () => {
        if (file.type.startsWith('image/')) {
            return <Image className={`${iconSize[size]} text-green-500`} />;
        } else if (file.type.includes('pdf')) {
            return <FileText className={`${iconSize[size]} text-red-500`} />;
        } else if (file.type.includes('doc') || file.type.includes('word')) {
            return <FileText className={`${iconSize[size]} text-blue-500`} />;
        } else {
            return <File className={`${iconSize[size]} text-gray-500`} />;
        }
    };

    return (
        <div className={`${sizeClasses[size]} flex-shrink-0`}>
            {preview ? (
                <img
                    src={preview}
                    alt={file.name}
                    className={`${sizeClasses[size]} object-cover rounded-md border`}
                />
            ) : (
                <div className={`${sizeClasses[size]} bg-gray-100 rounded-md border flex items-center justify-center`}>
                    {getFileIcon()}
                </div>
            )}
        </div>
    );
};

export default FilePreview;