import React, { useState, useCallback } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { useToast } from '../hooks/useToast';
import FilePreview from './filePreview';

const ProfilePhotoInput = ({
    uploadImageFn,
    uploadButtonLabel,
    maxFiles = 10,
    maxFileSize = 10,
    acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
    uploadImmediately = false,
}) => {
    const [files, setFiles] = useState([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const { toast } = useToast();

    const validateFile = (file) => {
        if (file.size > maxFileSize * 1024 * 1024) {
            return `File size exceeds ${maxFileSize}MB limit`;
        }
        const isValidType = acceptedTypes.some(type => {
            if (type.includes('*')) {
                return file.type.startsWith(type.replace('*', ''));
            }
            return file.type === type || file.name.toLowerCase().endsWith(type);
        });
        if (!isValidType) {
            return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`;
        }
        return null;
    };

    const createFilePreview = (file) => {
        return new Promise(resolve => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target?.result);
                reader.readAsDataURL(file);
            } else {
                resolve(undefined);
            }
        });
    };

    const acceptedTypesCount = acceptedTypes.length;
    const manageListOfFiles = useCallback(async (fileList) => {
        const newFiles = [];
        for (let i = 0; i < fileList.length && files.length + newFiles.length < maxFiles; i++) {
            const file = fileList[i];
            const error = validateFile(file);
            const preview = await createFilePreview(file);
            newFiles.push({
                id: `${Date.now()}-${i}`,
                file,
                preview,
                status: error ? 'error' : 'pending',
                progress: 0,
                error,
            });
        }
        if (fileList.length > maxFiles - files.length) {
            toast({
                title: "Too many files",
                description: `Only ${maxFiles - files.length} more files can be added`,
                variant: "destructive",
            });
        }
        setFiles(prev => [...prev, ...newFiles]);
    }, [files.length, maxFiles, maxFileSize, acceptedTypesCount, toast]);

    const uploadFile = async (uploadFile) => {
        const formData = new FormData();
        formData.append('file', uploadFile.file);
        setFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f));
        if (uploadImageFn) {
            uploadImageFn({ formData, file: uploadFile.file, fileId: uploadFile.id })
        }
    };
    const uploadAllFiles = async () => {
        const pendingFiles = files.filter(f => f.status === 'pending');
        if (pendingFiles.length === 0) {
            toast({
                title: "No files to upload",
                description: "Please add some files first",
                variant: "destructive",
            });
            return;
        }
        try {
            pendingFiles.map(file => uploadFile(file))
        } catch (error) {
            console.error('Upload error:', error);
        }
    };

    const uploadFileImmediately = async (newFile) => {
        const formData = new FormData();
        formData.append('file', newFile);
        if (uploadImageFn) {
            uploadImageFn({ formData, file: newFile })
        }
    };
    const uploadManyFilesImmediately = async (newFiles) => {
        for (let i = 0; (i < newFiles.length); i++) {
            const file = newFiles[i];
            uploadFileImmediately(file)
        }
    };

    const removeFile = (fileId) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
            if (uploadImmediately) {
                uploadManyFilesImmediately(droppedFiles)
            } else {
                manageListOfFiles(droppedFiles);
            }
        }
    }, [manageListOfFiles]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleFileInput = (e) => {
        if (e.target.files) {
            if (uploadImmediately) {
                uploadManyFilesImmediately(e.target.files)
            } else {
                manageListOfFiles(e.target.files);
            }
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'uploading':
                return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            default:
                return null;
        }
    };

    return (
        <div className="w-full max-w-4xl space-y-6">
            {(files.length > 0) && (
                <Card>
                    <CardContent className="p-6">

                        {(!uploadImmediately) &&
                            <div className="flex justify-between items-center my-2">
                                <h3 className="text-lg font-medium">Files ({files.length})</h3>
                                <div className="space-x-2">
                                    <Button onClick={uploadAllFiles}
                                        disabled={files.filter(f => f.status === 'pending').length === 0}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        Upload now
                                    </Button>
                                    <Button onClick={() => setFiles([])} variant="outline">
                                        x
                                    </Button>
                                </div>
                            </div>
                        }

                        <div className="space-y-3 mt-3">
                            {files.map((file) => (
                                <div key={file.id} className="flex items-center space-x-3 p-3 rounded-lg">
                                    <FilePreview file={file.file} preview={file.preview} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{file.file.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {(file.file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                        {file.status === 'uploading' && (
                                            <Progress value={file.progress} className="mt-2" />
                                        )}
                                        {file.error && (
                                            <p className="text-xs text-red-500 mt-1">{file.error}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {getStatusIcon(file.status)}
                                        <Button
                                            onClick={() => removeFile(file.id)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </CardContent>
                </Card>
            )}

            <Card
                className={`transition-all duration-200 ${isDragOver ? 'border-blue-500 bg-blue-50 border' : 'border-dashed border border-gray-300'}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <CardContent className="flex flex-col items-center justify-center p-8">
                    <Upload className={`h-6 w-6 my-4 ${isDragOver ? 'text-blue-500' : 'text-lime-400'}`} />
                    <input
                        type="file"
                        accept={acceptedTypes.join(',')}
                        onChange={(e) => {
                            handleFileInput(e)
                            uploadAllFiles()
                        }}
                        className="hidden"
                        id="image-input"
                        multiple
                    />
                    <Button
                        onClick={() => {
                            document.getElementById('image-input')?.click()
                        }}
                        variant="outline"
                        className="text-blue-600 text-sm font-semibold border border-lime-400"
                    >
                        {uploadButtonLabel}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfilePhotoInput;