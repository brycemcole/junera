
-- ...existing code...

CREATE PROCEDURE InsertJobPosting
    @Title NVARCHAR(MAX),
    @CompanyId INT,
    @Location NVARCHAR(MAX),
    @Description NVARCHAR(MAX),
    @Link NVARCHAR(MAX),
    @JobId INT OUTPUT -- Output parameter to return the inserted or existing ID
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        -- Ensure an index exists on the 'link' column for faster searches
        CREATE INDEX IDX_jobPostings_link ON jobPostings(link);

        -- ...existing code...
    END TRY
    BEGIN CATCH
        -- ...existing code...
    END CATCH
END;