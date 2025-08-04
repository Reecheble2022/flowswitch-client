import React from 'react';
import { FileText, File, Image } from 'lucide-react';

const FileIcon = ({ type }) => {
    switch (type) {
        case 'pdf':
            return (
                <FileText className={`h-12 w-12 text-red-500`} />
            );
        case 'doc':
            return (
                <FileText className={`h-12 w-12 text-blue-500`} />
            );
        case 'image':
            return (
                <Image className={`h-12 w-12 text-green-500`} />
            );
        default:
            return (
                <File className={`h-12 w-12 text-gray-500`} />
            );
    }
};

const DocumentList = ({ documents }) => {
    return (
        <div className="p-3">
            <div className="grid grid-cols-1">
                <div className="text-lg"> Documents: </div>
                {documents.map((doc, index) => {
                    const fileType = doc?.split('.').pop(); // Get file extension (e.g., 'pdf', 'doc')
                    return (
                        <div
                            key={index}
                            className="flex items-center py-2 hover:bg-gray-50 cursor-pointer"
                            onClick={() => window.open(doc, '_blank')}
                        >
                            <div className="mr-4 rounded-lg shadow-lg bg-white">
                                <FileIcon type={fileType} />
                            </div>
                            <span className="text-gray-800">{doc?.split('/').pop()}</span> {/* Display file name */}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DocumentList;
