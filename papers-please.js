class Inspector {
  constructor() {
    this.requirements = {}
    this.vaccinations = {}
    this.allowed = {}
    this.criminals = {}
    this.mismatchFields = ['ID#', 'NATION', 'NAME', 'DOB'];
    this.expiredAt = [1982, 11, 22];
  }
  receiveBulletin (bulletin){
    console.log(bulletin);
    console.log('\n');
    this.criminals = {} // reset criminals
    let lines = bulletin.split('\n');
    for(let line of lines) {
      if (line.includes('no longer require')) {
        let [people, what] = line.split(' no longer require ');
        if (people.includes('Citizens of ')) {
          people = people.split('Citizens of ')[1].split(', ')
        } else {
          people = [people]
        }
        if (what.includes('vaccination')) {
          let type = what.split(' vaccination')[0];
          for (let person of people) {
            if (this.vaccinations[person]) {
              delete this.vaccinations[person][type];
            }
          }
        } else {
          for (let person of people) {
            if (this.requirements[person]) {
              delete this.requirements[person][what.replace(/ /g,'_')];
            }
          }
        }
      } else if (line.includes('require')) {
        let [people, what] = line.split(' require ');
        if (people.includes('Citizens of ')) {
          people = people.split('Citizens of ')[1].split(', ')
        } else {
          people = [people]
        }
        if (what.includes('vaccination')) {
          let type = what.split(' vaccination')[0];
          for (let person of people) {
            if(!this.vaccinations[person]) this.vaccinations[person] = {};
            this.vaccinations[person][type] = true;
          }
        } else {
          for (let person of people) {
            if(!this.requirements[person]) this.requirements[person] = {};
            this.requirements[person][what.replace(/ /g,'_')] = true;
          }
        }
      } else if (line.includes('Allow citizens of ')) {
        let countries = line.split(' of ')[1].split(', ');
        countries.forEach(c => this.allowed[c] = true);
      } else if (line.includes('Deny citizens of ')) {
        let countries = line.split(' of ')[1].split(', ');
        countries.forEach(c => {delete this.allowed[c]});
      } else if (line.includes('Wanted by the State')) {
        let criminal = line.split(': ')[1];
        this.criminals[criminal] = true;
      }
    }
    // console.log(this);
  }
  inspect(docs) {
    console.log(docs);
    let parsedDocs = Object.keys(docs).reduce((c, key) => {
      c[key] = docs[key].split('\n').map((l) => l.split(': ')).reduce((cc, [k, v]) => {
        cc[k] = v;
        if (k === 'NAME') cc[k] = cc[k].split(', ').reverse().join(' ');
        return cc;
      }, {});
      return c;
    }, {});

    let entrantRequirements = Object.keys(this.requirements.Entrants || {});
    for (let key of entrantRequirements) {
      if (!parsedDocs[key]) return `Entry denied: missing required ${key.replace(/_/g,' ')}.`;
    }

    let provided = Object.keys(docs);

    // Check is the user a criminal
    let name = parsedDocs[provided[0]].NAME;
    if (this.criminals[name]) {
      return `Detainment: Entrant is a wanted criminal.`;
    }

    // find is there any mismatches in data
    // Detainment: ID number mismatch.
    for (let field of this.mismatchFields) {
      let idProvided = provided.filter((p) => p !== 'certificate_of_vaccination');
      if(idProvided.every((p) => parsedDocs[p][field])) {
        let check = parsedDocs[idProvided[0]][field];
        for(let p of idProvided) {
          if (parsedDocs[p][field] !== check) {
            return `Detainment: ${field} mismatch.`
              .replace('ID#', 'ID number')
              .replace('NATION', 'nationality')
          }
        }
      }
    }

    let nation = parsedDocs[provided[0]].NATION;
    let isForeigner = nation !== 'Arstotzka';
    let isWorker = (isForeigner && parsedDocs.access_permit && parsedDocs.access_permit.PURPOSE === 'WORK');
    if (isWorker) {
      // Check the worker requirements
      let workerRequirements = Object.keys(this.requirements.Workers || {});
      for (let key of workerRequirements) {
        if (!parsedDocs[key]) return `Entry denied: missing required ${key.replace(/_/g,' ')}.`;
      }
    }

    if (isForeigner) {
      // Check the foreigner requirements
      let foreignerRequirements = Object.keys(this.requirements.Foreigners || {});
      for (let key of foreignerRequirements) {
        if (!parsedDocs[key]) {
          if (key !== 'access_permit') return `Entry denied: missing required ${key.replace(/_/g,' ')}.`;
          if (!parsedDocs.diplomatic_authorization && !parsedDocs.grant_of_asylum) return `Entry denied: missing required ${key.replace(/_/g,' ')}.`;
          // Check for valid diplomatic_authorization
          if (parsedDocs.diplomatic_authorization) {
            let nations = parsedDocs.diplomatic_authorization.ACCESS.split(', ');
            if (!nations.includes('Arstotzka')) return 'Entry denied: invalid diplomatic authorization.';
          }
        };
      }
      // Check are they from an allowed nation
      if (!this.allowed[nation]) {
        return 'Entry denied: citizen of banned nation.';
      }
    }

    // Check for country specific requirements
    let nationRequirements = Object.keys(this.requirements[nation] || {});
    for (let key of nationRequirements) {
      if (!parsedDocs[key]) return `Entry denied: missing required ${key.replace(/_/g,' ')}.`;
    }

    // Check for expiry
    for(let p of provided) {
      if (parsedDocs[p].EXP) {
        let expiry = parsedDocs[p].EXP.split('.').map((i) => parseInt(i));
        for (let i = 0; i < this.expiredAt.length; i++) {
          if (this.expiredAt[i] > expiry[i]) {
            return `Entry denied: ${p.replace(/_/g,' ')} expired.`;
          }
          if (this.expiredAt[i] < expiry[i]) {
            break;
          }
        }
      }
    }

    // Check for vaccination requirements
    let vaccineRequirements = Object.keys(this.vaccinations.Entrants || {});
    if (vaccineRequirements.length) {
      if (!parsedDocs.certificate_of_vaccination) {
        return `Entry denied: missing required certificate of vaccination.`;
      }
      for (let vaccine of vaccineRequirements) {
        if (!parsedDocs.certificate_of_vaccination.VACCINES.includes(vaccine)) return `Entry denied: missing required vaccination.`;
      }
    }
    let nationVaccineRequirements = Object.keys(this.vaccinations[nation] || {});
    if (nationVaccineRequirements.length) {
      if (!parsedDocs.certificate_of_vaccination) {
        return `Entry denied: missing required certificate of vaccination.`;
      }
      for (let vaccine of nationVaccineRequirements) {
        if (!parsedDocs.certificate_of_vaccination.VACCINES.includes(vaccine)) return `Entry denied: missing required vaccination.`;
      }
    }

    return isForeigner ? 'Cause no trouble.' : 'Glory to Arstotzka.';
  }
}
//code your methods
const inspector = new Inspector();
// const bulletin = 'Entrants require passport\nAllow citizens of Arstotzka, Obristan\nForeigners require access permit\nWanted by the State: Benito Latva';
// inspector.receiveBulletin(bulletin);
//
// let users = [{
// 	passport:'ID#: GC07D-FU8AR\nNATION: Arstotzka\nNAME: Costanza, Josef\nDOB: 1933.11.28\nSEX: M\nISS: East Grestin\nEXP: 1982.11.22'
// },{
// 	acces_permit: 'NAME: Guyovich, Russian\nNATION: Obristan\nID#: TE8M1-V3N7R\nPURPOSE: TRANSIT\nDURATION: 14 DAYS\nHEIGHT: 159cm\nWEIGHT: 60kg\nEXP: 1983.07.13'
// },{
// 	passport:'ID#: WK9XA-LKM0Q\nNATION: United Federation\nNAME: Dolanski, Roman\nDOB: 1933.01.01\nSEX: M\nISS: Shingleton\nEXP: 1983.05.12',
// 	grant_of_asylum: 'NAME: Dolanski, Roman\nNATION: United Federation\nID#: Y3MNC-TPWQ2\nDOB: 1933.01.01\nHEIGHT: 176cm\nWEIGHT: 71kg\nEXP: 1983.09.20'
// },{
//   passport: 'ID#: NCHF5-AT77X\nNATION: Republia\nNAME: Latva, Benito\nDOB: 1951.08.19\nSEX: F\nISS: True Glorian\nEXP: 1984.05.26'
// }];

const bulletin = `Allow citizens of Republia
Deny citizens of Impor
Allow citizens of Kolechia
Citizens of Kolechia require yellow fever vaccination
Citizens of Kolechia no longer require yellow fever vaccination
Citizens of Republia, Antegria, Impor require polio vaccination
Workers require work pass
Wanted by the State: Brenna Shaw`
inspector.receiveBulletin(bulletin);

let users = [{ passport: 'ID#: MKMY6-N9EJ5\nNATION: Kolechia\nNAME: Kowalska, Yelena\nDOB: 1940.05.12\nSEX: F\nISS: West Grestin\nEXP: 1984.08.14',
  access_permit: 'NAME: Kowalska, Yelena\nNATION: Kolechia\nID#: MKMY6-N9EJ5\nPURPOSE: VISIT\nDURATION: 1 MONTH\nHEIGHT: 147cm\nWEIGHT: 43kg\nEXP: 1986.09.12' }];

for(let user of users) {
  console.log(inspector.inspect(user));
}
