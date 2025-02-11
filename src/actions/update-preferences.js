'use server'

export async function updatePreferences(token, formData) {
    try {
        // Ensure all array fields are properly formatted
        const processedData = {
            ...formData,
            job_prefs_title: formData.job_prefs_title
                ? (Array.isArray(formData.job_prefs_title)
                    ? formData.job_prefs_title
                    : [formData.job_prefs_title])
                : [],
            job_prefs_location: formData.job_prefs_location
                ? (Array.isArray(formData.job_prefs_location)
                    ? formData.job_prefs_location
                    : [formData.job_prefs_location])
                : [],
            job_prefs_level: formData.job_prefs_level
                ? (Array.isArray(formData.job_prefs_level)
                    ? formData.job_prefs_level
                    : [formData.job_prefs_level])
                : [],
            job_prefs_salary: formData.job_prefs_salary
                ? parseInt(formData.job_prefs_salary, 10)
                : null,
            job_prefs_relocatable: Boolean(formData.job_prefs_relocatable)
        };

        const response = await fetch(`/api/user/preferences`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(processedData),
        });

        if (!response.ok) {
            throw new Error('Failed to update preferences');
        }

        return await response.json();
    } catch (err) {
        console.error('Error updating preferences:', err);
        throw err;
    }
}
