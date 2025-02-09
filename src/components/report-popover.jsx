export default function ReportPopover() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button size="sm" variant="outline"><Flag /></Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 mx-4">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Report Job Posting</h4>
                        <p className="text-sm text-muted-foreground">
                            Report an issue with this job posting
                        </p>
                    </div>
                    <form className="grid gap-4">
                        <div className="grid gap-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="missingInformation"
                                    name="issueType"
                                    value="missingInformation"
                                    className="h-4 w-4"
                                />
                                <label htmlFor="missingInformation" className="text-sm">
                                    Missing Information
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="inactiveJob"
                                    name="issueType"
                                    value="inactiveJob"
                                    className="h-4 w-4"
                                />
                                <label htmlFor="inactiveJob" className="text-sm">
                                    Inactive Job Posting
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="incorrectDetails"
                                    name="issueType"
                                    value="incorrectDetails"
                                    className="h-4 w-4"
                                />
                                <label htmlFor="incorrectDetails" className="text-sm">
                                    Incorrect Job Details
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="other"
                                    name="issueType"
                                    value="other"
                                    className="h-4 w-4"
                                />
                                <label htmlFor="other" className="text-sm">
                                    Other
                                </label>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="comments" className="text-sm font-medium">
                                Additional Comments (optional)
                            </label>
                            <textarea
                                id="comments"
                                rows="3"
                                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                                placeholder="Provide more details here..."
                            ></textarea>
                        </div>
                        <Button type="submit">Submit Report</Button>
                    </form>
                </div>
            </PopoverContent>
        </Popover>
    );
}