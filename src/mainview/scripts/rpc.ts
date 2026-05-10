import {AppRPCSchema} from "../../shared/rpc-define";
import {Electroview} from "electrobun/view";


export const rpc = Electroview.defineRPC<AppRPCSchema>({
    handlers: {
        requests: {},
        messages: {}
    }
});

export const view = new Electroview({rpc})
