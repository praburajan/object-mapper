import { mapObject } from '../object-mapper'
import { join, prop, propEq, find, pluck, sortBy, compose, curry, map } from 'ramda'
import chai from 'chai'

chai.should()
const expect = chai.expect

//test data

const profile = {
    name: 'Prabu',
    lastName: 'Rajan',
    age: 39,
    education: {
        qualification: 'B.E (Mech)',
        school: {
            name: "VHN",
            city: "Madurai",
            year: 1996
        },
        undergrad: {
            name: "TCE",
            city: "Madurai",
            year: 2000,
            university: "MKU"
        }
    },
    experience: [{
        type: "employed",
        employer: "Wipro Systems",
        yearOfJoining: 2003,
        yearOfLeaving: 2004,
        designation: "SDE"
    }, {
        type: "employed",
        employer: "Zoho Systems",
        yearOfJoining: 2000,
        yearOfLeaving: 2003,
        designation: "SDE"
    }, {
        type: "employed",
        employer: "Oracle India",
        yearOfJoining: 2004,
        designation: "SDE"
    }],
    addresses: [{
        type: "office",
        city: "bangalore",
        area: "koramangala",
        street: "chikka audugodi",
        number: "29"
    }, {
        type: "residence",
        city: "bangalore",
        area: "bellandur",
        street: "Adarsh palm retreat",
        number: "D002"
    }]
}

describe('object-mapper', () => {
    it('should return the mapped object for a config with a simple non-path property', (done) => {
        const result = mapObject({ name: 'name' }, profile)
        result.should.deep.equal({
            name: 'Prabu'
        })
        done()
    })

    it('should return the mapped object for a config with a hierachical path property', (done) => {
        const result = mapObject({
            cityOfSchool: 'education.school.city'
        }, profile)
        result.should.deep.equal({
            cityOfSchool: 'Madurai'
        })
        done()
    })

    it('should return the mapped object for a config with an array of properties - mixed path and non-path', (done) => {
        const result = mapObject({
            result: ['name', 'education.qualification']
        }, profile)
        result.should.deep.equal({
            result: ['Prabu', 'B.E (Mech)']
        })
        done()
    })

    it('should return mapped object for a config with a compute function', (done) => {
        const config = {
            fullName: {
                pick: ['name', 'lastName'],
                compute: join(' ')
            }
        }
        const result = mapObject(config, profile)
        result.should.deep.equal({
            fullName: 'Prabu Rajan'
        })
        done()
    })

    it('should return a mapped object for a config with multiple properties of mixed path, non-path and with computed properties', (done) => {
        const config = {
            degree: 'education.qualification',
            residenceAddress: {
                pick: 'addresses',
                compute: find(propEq('type', 'residence'))
            },
            fullName: {
                pick: ['name', 'lastName'],
                compute: join(' ')
            },
            employers: {
                pick: 'experience',
                compute: compose(pluck('employer'), sortBy(prop('yearOfJoining')))
            }
        }

        const result = mapObject(config, profile)
        result.should.deep.equal({
            degree: 'B.E (Mech)',
            residenceAddress: {
                type: "residence",
                city: "bangalore",
                area: "bellandur",
                street: "Adarsh palm retreat",
                number: "D002"
            },
            fullName: 'Prabu Rajan',
            employers: ['Zoho Systems', 'Wipro Systems', 'Oracle India']
        })
        done()
    })

    it('should return a mapped object for a config with nested mapObject compute function', (done) => {
        const addressConfig = {
            type: 'type',
            fullAddress: {
                pick: ['number', 'street', 'area', 'city'],
                compute: join(', ')
            }
        }

        const config = {
            fullName: {
                pick: ['name', 'lastName'],
                compute: join(' ')
            },
            addresses: {
                pick: 'addresses',
                compute: map(mapObject(addressConfig))
            }
        }
        
        const result = mapObject(config, profile)
        result.should.deep.equal({
            fullName: 'Prabu Rajan',
            addresses: [{
                type: 'office',
                fullAddress: '29, chikka audugodi, koramangala, bangalore'
            }, {
                type: 'residence',
                fullAddress: 'D002, Adarsh palm retreat, bellandur, bangalore'
            }]
        })
        done()
    })

    it('should return a mapped object with undefined value for a config with an invalid property', (done) => {
        const config = {
            name: 'fullName'
        }
        const result = mapObject(config, profile)
        result.should.deep.equal({
            name: undefined
        })
        done()
    })

    it('should throw an exception for a config with an invalid property applied on a compute function', (done) => {
        const config = {
            name: {
                pick: 'fullName',
                compute: function(name) {
                    return name.concat('bomb!')
                }
            }
        }
        const callMapObject = function() {
            return mapObject(config, profile)
        }
        callMapObject.should.throw(TypeError)
        done()
    })

})