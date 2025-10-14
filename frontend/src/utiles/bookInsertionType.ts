

export interface BookInsertionType {

        bookType: string,
    bookNo: string,
    bookDate: string,
    directoryName: string,
    incomingNo: string,
    incomingDate: string,
    subject: string,
    
    bookAction: string,
    bookStatus: string,
    notes: string,
    userID: string ,
    selectedCommittee: number | undefined; // Add for committee selection
    //deID?: number | undefined | null
    deIDs: number[]; // Changed from deID to deIDs array


}