"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCharacterLimit } from "@/hooks/use-character-limit";
import { useImageUpload } from "@/hooks/use-image-upload";
import { Check, ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const FIELD_TYPES = {
    TEXT: 'text',
    TEXTAREA: 'textarea',
    EMAIL: 'email',
    TEL: 'tel',
    NUMBER: 'number',
    SELECT: 'select',
    BOOLEAN: 'boolean',
    MULTISELECT: 'multiselect'
};

export default function EditProfileDialog({
    fields,
    initialData = {},
    onSubmit,
    title = "Edit Profile",
    description = "Make changes to your profile here."
}) {
    const [formData, setFormData] = useState(initialData);
    const [open, setOpen] = useState(false);

    const handleChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await onSubmit(formData);
            setOpen(false);
        } catch (err) {
            console.error('Error submitting form:', err);
        }
    };

    const renderField = (field) => {
        const { type, name, label, options, placeholder, required } = field;

        switch (type) {
            case FIELD_TYPES.TEXTAREA:
                return (
                    <div className="space-y-2" key={name}>
                        <Label htmlFor={`edit-${name}`}>{label}</Label>
                        <Textarea
                            id={`edit-${name}`}
                            placeholder={placeholder}
                            value={formData[name] || ''}
                            onChange={(e) => handleChange(name, e.target.value)}
                            required={required}
                        />
                    </div>
                );

            case FIELD_TYPES.SELECT:
                return (
                    <div className="space-y-2" key={name}>
                        <Label htmlFor={`edit-${name}`}>{label}</Label>
                        <select
                            id={`edit-${name}`}
                            value={formData[name] || ''}
                            onChange={(e) => handleChange(name, e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2"
                            required={required}
                        >
                            <option value="">Select an option</option>
                            {options?.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                );

            case FIELD_TYPES.MULTISELECT:
                return (
                    <div className="space-y-2" key={name}>
                        <Label htmlFor={`edit-${name}`}>{label}</Label>
                        <div className="flex flex-wrap gap-2">
                            {options?.map((opt) => {
                                const isSelected = Array.isArray(formData[name]) && formData[name].includes(opt.value);
                                return (
                                    <Button
                                        key={opt.value}
                                        type="button"
                                        variant={isSelected ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                            const currentValues = Array.isArray(formData[name]) ? formData[name] : [];
                                            const newValues = isSelected
                                                ? currentValues.filter(v => v !== opt.value)
                                                : [...currentValues, opt.value];
                                            handleChange(name, newValues);
                                        }}
                                    >
                                        {opt.label}
                                        {isSelected && <Check className="ml-2 h-4 w-4" />}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                );

            case FIELD_TYPES.BOOLEAN:
                return (
                    <div className="flex items-center space-x-2" key={name}>
                        <input
                            type="checkbox"
                            id={`edit-${name}`}
                            checked={formData[name] || false}
                            onChange={(e) => handleChange(name, e.target.checked)}
                            className="rounded border-gray-300"
                        />
                        <Label htmlFor={`edit-${name}`}>{label}</Label>
                    </div>
                );

            default:
                return (
                    <div className="space-y-2" key={name}>
                        <Label htmlFor={`edit-${name}`}>{label}</Label>
                        <Input
                            id={`edit-${name}`}
                            type={type}
                            placeholder={placeholder}
                            value={formData[name] || ''}
                            onChange={(e) => handleChange(name, e.target.value)}
                            required={required}
                        />
                    </div>
                );
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                        setFormData(initialData);
                        setOpen(true);
                    }}
                >
                    {title}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{typeof title === 'string' ? title : 'Edit Profile'}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {fields.map(renderField)}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Save changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ProfileBg({ defaultImage }) {
    const [hideDefault, setHideDefault] = useState(false);
    const { previewUrl, fileInputRef, handleThumbnailClick, handleFileChange, handleRemove } =
        useImageUpload();

    const currentImage = previewUrl || (!hideDefault ? defaultImage : null);

    const handleImageRemove = () => {
        handleRemove();
        setHideDefault(true);
    };

    return (
        <div className="h-32">
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-muted">
                {currentImage && (
                    <Image
                        className="h-full w-full object-cover"
                        src={currentImage}
                        alt={previewUrl ? "Preview of uploaded image" : "Default profile background"}
                        width={512}
                        height={96}
                    />
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-2">
                    <button
                        type="button"
                        className="z-50 flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white outline-offset-2 transition-colors hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70"
                        onClick={handleThumbnailClick}
                        aria-label={currentImage ? "Change image" : "Upload image"}
                    >
                        <ImagePlus size={16} strokeWidth={2} aria-hidden="true" />
                    </button>
                    {currentImage && (
                        <button
                            type="button"
                            className="z-50 flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white outline-offset-2 transition-colors hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70"
                            onClick={handleImageRemove}
                            aria-label="Remove image"
                        >
                            <X size={16} strokeWidth={2} aria-hidden="true" />
                        </button>
                    )}
                </div>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
                aria-label="Upload image file"
            />
        </div>
    );
}

function Avatar({ defaultImage }) {
    const { previewUrl, fileInputRef, handleThumbnailClick, handleFileChange } = useImageUpload();

    const currentImage = previewUrl || defaultImage;

    return (
        <div className="-mt-10 px-6">
            <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-muted shadow-sm shadow-black/10">
                {currentImage && (
                    <Image
                        src={currentImage}
                        className="h-full w-full object-cover"
                        width={80}
                        height={80}
                        alt="Profile image"
                    />
                )}
                <button
                    type="button"
                    className="absolute flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white outline-offset-2 transition-colors hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70"
                    onClick={handleThumbnailClick}
                    aria-label="Change profile picture"
                >
                    <ImagePlus size={16} strokeWidth={2} aria-hidden="true" />
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                    aria-label="Upload profile picture"
                />
            </div>
        </div>
    );
}
