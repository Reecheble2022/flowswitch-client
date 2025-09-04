import React, { useState, useEffect } from 'react';
import { useFileUploaderMutation } from "../backend/api/sharedCrud"
import { useSelector } from 'react-redux';
import { selectList } from '../backend/features/sharedMainState';
import ExcelInput from './excelInput';

const AgentsRegistrationUpload = ({ }) => {
    const [status, setStatus] = useState("");
    const [documentPickerLabel, setDocumentPickerLabel] = useState('Select file from device');
    const [uploadedDocuments, setUploadedDocuments] = useState([]);

    const cachedMerchants = useSelector(st => selectList(st, "merchant"))
    const [reRender, setReRender] = useState(false);
    useEffect(() => {
        if (!cachedMerchants) {
            setTimeout(() => {
                setReRender(!reRender)
            }, 1000)
        }
    }, [cachedMerchants])

    //------ Excel document --------
    const [uploadNewDocument, {
        isLoading: docUploadProcessing,
        isSuccess: docUploadSucceeded,
        isError: docUploadFailed,
        error: docUploadError,
    }] = useFileUploaderMutation()
    useEffect(() => {
        if (docUploadSucceeded) {
            setStatus("✅ Document uploaded");
        } else if (docUploadFailed) {
            console.error("Upload error:", docUploadError);
            setStatus("❌ Document upload failed");
        }
    }, [docUploadSucceeded, docUploadFailed]);

    const handleDocumentAttachment = ({ file, formData }) => {
        if (file) {
            const fData = new FormData();
            fData.set('file', file);
            uploadNewDocument({
                entity: "agent",
                submissionEndpoint: "agent/upload",
                data: fData,
            })
        }
    };

    return (
        <div className={`w-full p-6 bg-white rounded-lg shadow-lg xl:w-[30%]`}>
            <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800"> Upload Excel file </h2>
            <p>
                You can upload an Excel file containing a list of all agents you want to register, or drag and drop the file in the dotted area
            </p>
            <div className="space-y-4 w-full mt-8">
                <div className="mx-auto">
                    <ExcelInput
                        uploadDocumentFn={({ file, formData }) => handleDocumentAttachment({ file, formData })}
                        uploadButtonLabel={documentPickerLabel}
                        maxFiles={1}
                        maxFileSize={8}
                        acceptedDocTypes={['image/*', 'application/pdf', '.doc', '.docx', '.txt', '.xlsx', '.xls']}
                        uploadProcessing={docUploadProcessing}
                        docUploadSucceeded={docUploadSucceeded}
                        docUploadFailed={docUploadFailed}
                    />
                </div>
            </div>

            {status && (
                <div className={`mt-4 text-center text-sm font-medium px-4 py-2 rounded-md ${status.startsWith("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {status}
                </div>
            )}

        </div>
    );
};

export default AgentsRegistrationUpload;