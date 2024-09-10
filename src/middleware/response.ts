const responseCode = (code:any)  => {
    try {
        switch (code) {
            case 204 || 205:
                return 200
            default:
                return code
        }
    } catch (e: any) {
        console.log(e);
        
    }

}

export default responseCode