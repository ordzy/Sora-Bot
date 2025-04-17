import { config } from "dotenv";
config();

const isTest = process.env.isTest === "true";

class IDClass {

  ownershipID() {
    return "771514771295436851";
  }

  roleModuleCreator() {
    return isTest ? "1355635957482655807" : "1318540329070104576";
  }

  roleDev() {
    return isTest ? "1355635957482655812" : "1293431333686612008";
  }

  roleHelper() {
    return isTest ? "1355635957482655809" : "1315038293343342642";
  }

  logChannel() {
    return isTest ? "1355635959860826348" : "1353519265684127744";
  }

  restrictedCategory() {
    return isTest ? "1355635959676538930" : "1293432337740075118";
  }

  roleMods() {
    return isTest
      ? ["1355635957482655812", "1355635957532983316", "1355635957532983318"]
      : ["1293431333686612008", "1346527970801618974", "1334894580428050483"];
  }

  roleIMP() {
    return isTest
      ? ["1355635957482655808", "1355635957482655806", "1355635957482655807"]
      : ["1324842486002221136", "1316454495915347998", "1318540329070104576", "1315038293343342642"];
  }

  channelErrorLogs() {
    return isTest ? "1355635959860826350" : "1355245590589473042";
  }

  soraBotRole() {
    return isTest ? "1355640963313172593" : "1333527326000152689";
  }

  roleDonator() {
    return "1311939595096821760"; // same on both
  }

  roleIBH() {
    return isTest ? "1355635957482655810" : "1293635318834003978";
  }

  rolePaul() {
    return isTest ? "1355635957532983316" : "1346527970801618974";
  }

  roleContributor() {
    return isTest ? "1355635957482655808" : "1324842486002221136";
  }

  roleRomanceSquad() {
    return isTest ? "1355635957482655804" : "1322845166968635454";
  }

  roleDesigner() {
    return isTest ? "1355635957482655813" : "1340652151286009987";
  }

  roleCranci() {
    return isTest ? "1355635957532983318" : "1334894580428050483";
  }

  roleServerBooster() {
    return "1315850783907905557";
  }

  roleImportant() {
    return isTest ? "1355635957482655806" : "1316454495915347998";
  }

  channelMRC() {
    return isTest ? "1355635959676538929" : "1354566997593165914";
  }

  channelMR() {
    return isTest ? "1355635958795731074" : "1354754457912741888";
  }

  channelMRC2() {
    return isTest ? "1355635958795731075" : "1355238695220809910";
  }
 
  channelJLG() {
    return isTest ? "1362495682371387576" : "1362495755310334042";
  }
 
  VCTotal() {
    return isTest ? "1362447889615425566" : "1362447649206435911";
  }
}

//role/channelNAME() {
//  return isTest ? "TEST_ROLE/CHANNEL_ID" : "MAIN_ROLE_CHANNEL_ID";
//}

const idclass = new IDClass();
export default idclass;