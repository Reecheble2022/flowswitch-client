import React, { useState, useRef, useEffect } from 'react';
import { FloatingLabelInput } from "./floatingLabelInput"
import { useFileUploaderMutation, useItemRegistrerMutation, useItemsListReaderQuery } from "../backend/api/sharedCrud"
import { useSelector } from 'react-redux';
import { selectList } from '../backend/features/sharedMainState';
import ProfileImageInput from './profilePhotoInput';
import DocumentsInput from './documentsInput';

const AgentsRegistrationForm = ({ formLabel }) => {
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [photoLabel, setPhotoLabel] = useState('Profile Photo');
    const [documentPickerLabel, setDocumentPickerLabel] = useState('Attach document(s)');
    const [uploadedDocuments, setUploadedDocuments] = useState([]);
    const [photoUploadGuid, setPhotoUploadGuid] = useState(undefined);
    const [merchantsAppliedFor, setMerchantsAppliedFor] = useState([]);
    const [category, setCategory] = useState("");
    const [allMerchants, setAllMerchants] = useState([{ guid: "ea324241315ac", merchantName: "Reech" }, { guid: "ea324774322", merchantName: "Aever" }]);
    // New state variables for form inputs
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        physicalAddress: '',
        nationality: '',
        nationalId: '',
        dateOfBirth: '',
        primaryPurpose: ''
    });

    const {
        isLoading: merchantsProcessing,
        isSuccess: merchantsSucceeded,
        isError: merchantsFailed,
        error: merchantsError,
    } = useItemsListReaderQuery({ entity: "merchant" })

    const cachedMerchants = useSelector(st => selectList(st, "merchant"))
    const [reRender, setReRender] = useState(false);
    useEffect(() => {
        if (!cachedMerchants) {
            setTimeout(() => {
                setReRender(!reRender)
            }, 1000)
        }
    }, [cachedMerchants])

    //============= submit to Cloud Run ======================
    //---- profile image ----
    const [uploadNewImage, {
        data: fileUploadSuccessResponse,
        isLoading: fileUploadProcessing,
        isSuccess: fileUploadSucceeded,
        isError: fileUploadFailed,
        error: fileUploadError,
    }] = useFileUploaderMutation()
    const { Data: { url, guid } = {} } = fileUploadSuccessResponse || {}
    useEffect(() => {
        if (fileUploadSucceeded && (guid || url)) {
            setPhotoUploadGuid(guid);
            setStatus("✅ Photo uploaded");
        } else if (fileUploadFailed) {
            console.error("Upload error:", fileUploadError);
            setStatus("❌ Photo upload failed");
        }
    }, [fileUploadSucceeded, fileUploadFailed]);
    //------ documents --------
    const [uploadNewDocument, {
        data: docUploadSuccessResponse,
        isLoading: docUploadProcessing,
        isSuccess: docUploadSucceeded,
        isError: docUploadFailed,
        error: docUploadError,
    }] = useFileUploaderMutation()
    const { Data: { url: docUploadUrl, guid: docUploadGuid } = {} } = docUploadSuccessResponse || {}
    useEffect(() => {
        if (docUploadSucceeded && (docUploadGuid || docUploadUrl)) {
            if (!uploadedDocuments.includes(docUploadGuid)) {
                setUploadedDocuments([...uploadedDocuments, docUploadGuid]);
                setStatus("✅ Document uploaded");
            }
        } else if (docUploadFailed) {
            console.error("Upload error:", docUploadError);
            setStatus("❌ Document upload failed");
        }
    }, [docUploadSucceeded, docUploadFailed]);

    //------ agent data -----
    const [submitNewAgent, {
        data: agentRegSuccessResponse,
        isLoading: agentRegProcessing,
        isSuccess: agentRegSucceeded,
        isError: agentRegFailed,
        error: agentRegError,
    }] = useItemRegistrerMutation()
    useEffect(() => {
        if (agentRegSucceeded) {
            setStatus("✅ Agent registered successfully!");
            setLoading(false);
            // Reset form fields after successful submission
            setFormData({
                firstName: '',
                lastName: '',
                phone: '',
                email: '',
                physicalAddress: '',
                nationality: '',
                nationalId: '',
                dateOfBirth: '',
                primaryPurpose: ''
            });
            setCategory('');
            setMerchantsAppliedFor([]);
            setPhotoUploadGuid(undefined);
            setUploadedDocuments([]);
            setPreview(null);
            setPhotoLabel('Profile Photo');
            setDocumentPickerLabel('Attach document(s)');
        } else if (agentRegFailed) {
            setStatus("❌ Failed to register agent. Please try again.");
            setLoading(false);
        }
    }, [agentRegSucceeded, agentRegFailed]);

    const handlePhotoChange = ({ file, formData }) => {
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
            setPhotoLabel("Change Photo");
            const fData = new FormData();
            fData.set('file', file);
            uploadNewImage({
                entity: "fileupload",
                data: fData,
            })
        } else {
            setPreview(null);
            setPhotoLabel("Profile Photo");
        }
    };

    const handleDocumentAttachment = ({ file, formData }) => {
        if (file) {
            setDocumentPickerLabel("Add another document");
            const fData = new FormData();
            fData.set('file', file);
            uploadNewDocument({
                entity: "fileupload",
                data: fData,
            })
        } else {
            setDocumentPickerLabel("Attach document(s)");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    //============= submit to Cloud Run ======================
    const handleSubmitToCloudRun = async (e) => {
        e.preventDefault();
        setStatus('');
        setLoading(true);

        // Validate required fields
        if (!formData.firstName || !formData.lastName || !category) {
            setStatus('Please fill out all required fields.');
            setLoading(false);
            return;
        }

        const payload = {
            merchants: merchantsAppliedFor,
            firstName: formData.firstName,
            lastName: formData.lastName,
            category,
            phone: formData.phone,
            email: formData.email,
            physicalAddress: formData.physicalAddress,
            nationality: formData.nationality,
            nationalId: formData.nationalId,
            dateOfBirth: formData.dateOfBirth,
            primaryPurpose: formData.primaryPurpose,
            photo: photoUploadGuid,
            documents: uploadedDocuments,
        }
        submitNewAgent({ entity: "agent", data: payload })
    }
    //============= /end submit to Cloud Run =================

    return (
        <div className={`w-full ${formLabel?"xl:w-[70%]":"xl:max-w-full"} p-6 bg-white rounded-lg shadow-lg`}>
            <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800"> {formLabel || "Register new Agent"} </h2>
            
            <div className="flex flex-col lg:flex-row gap-8 w-full">
                <div className={`flex-item w-full ${formLabel?"lg:w-[50%]":""} space-y-4`}>
                    <div>
                        <FloatingLabelInput
                            label="First name"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div>
                        <FloatingLabelInput
                            label="Last name"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Category</label>
                        <select
                            name="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            required
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-lime-500 focus:border-lime-500 p-2 pl-1"
                        >
                            <option value="">--</option>
                            <option value="Male">Individuals</option>
                            <option value="Female">Salons</option>
                            <option value="Male">Shops</option>
                            <option value="Female">Market venders</option>
                            <option value="Female">Momo agents</option>
                            <option value="Female">Street hauckers</option>
                        </select>
                    </div>
                    <div>
                        <FloatingLabelInput
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <FloatingLabelInput
                            label="Phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <FloatingLabelInput
                            label="Physical address"
                            name="physicalAddress"
                            value={formData.physicalAddress}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <FloatingLabelInput
                            label="Nationality"
                            name="nationality"
                            value={formData.nationality}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <FloatingLabelInput
                            label="National ID"
                            name="nationalId"
                            value={formData.nationalId}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

                <div className={`flex-item w-full ${formLabel?"lg:w-[50%]":""} space-y-4`}>
                    <div className="z-2">
                        <FloatingLabelInput
                            label="Description"
                            name="primaryPurpose"
                            value={formData.primaryPurpose}
                            onChange={handleInputChange}
                            multiline={true}
                            rows={2}
                        />
                    </div>

                    <hr />

                    {/* Preview Image */}
                    {preview && (
                        <div>
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full max-h-48 object-cover rounded-xl border border-lime-400"
                            />
                        </div>
                    )}

                    <div className="container mx-auto">
                        <ProfileImageInput
                            uploadImageFn={({ file, formData }) => handlePhotoChange({ file, formData })}
                            uploadButtonLabel={photoLabel}
                            maxFiles={1}
                            maxFileSize={10}
                            acceptedTypes={['image/*']}
                            uploadImmediately={true}
                        />
                    </div>

                    <div className="mx-auto">
                        <DocumentsInput
                            uploadDocumentFn={({ file, formData }) => handleDocumentAttachment({ file, formData })}
                            uploadButtonLabel={documentPickerLabel}
                            maxFiles={4}
                            maxFileSize={8}
                            acceptedDocTypes={['image/*', 'application/pdf', '.doc', '.docx', '.txt']}
                        />
                    </div>

                    <div>
                        <button
                            onClick={handleSubmitToCloudRun}
                            type="submit"
                            disabled={agentRegProcessing || loading}
                            className={`w-full mt-8 py-2 px-4 rounded-md text-white font-medium ${(agentRegProcessing || loading)
                                ? 'bg-blue-300 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {(agentRegProcessing || loading) ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
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

export default AgentsRegistrationForm;