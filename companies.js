
let companies = [
    {   
        "_id" : 1,
        "name" : "Company1",
        "earn" : 25000,
        "earn_plus_subcomp_earn" : 53000,
        "subcompanies" : [
            {
                "_id" : 2,
                "name" : "Company2",
                "earn" : 13000,
                "earn_plus_subcomp_earn" : 18000,
                "subcompanies" : [
                    {
                        "_id" : 3,
                        "name" : "Company3",
                        "earn" : 5000,
                        "earn_plus_subcomp_earn" : 5000,
                        "subcompanies" : []
                    }
                ]
            },
            {
                "_id" : 4,
                "name" : "Company4",
                "earn" : 10000,
                "earn_plus_subcomp_earn" : 10000,
                "subcompanies" : []
            }
        ]

    },
    {
        "_id" : 5,
        "name" : "Company5",
        "earn" : 10000,
        "earn_plus_subcomp_earn" : 30000,
        "subcompanies" : [
            {
                "_id" : 6,
                "name" : "Company6",
                "earn" : 15000,
                "earn_plus_subcomp_earn" : 15000,
                "subcompanies" : []
            },
            {
                "_id" : 7,
                "name" : "Company7",
                "earn" : 5000,
                "earn_plus_subcomp_earn" : 5000,
                "subcompanies" : []
            }
        ]

    }
];

let companiesMDB = [
    {
        "_id" : 1,
        "name" : "Company1",
        "earn" : 25000,
        "parent_company_id" : null
    },
    {
        "_id" : 2,
        "name" : "Company2",
        "earn" : 13000,
        "parent_company_id" : 1
    },
    {
        "_id" : 3,
        "name" : "Company3",
        "earn" : 5000,
        "parent_company_id" : 2
    },
    {
        "_id" : 4,
        "name" : "Company4",
        "earn" : 10000,
        "parent_company_id" : 1
    },
    {
        "_id" : 5,
        "name" : "Company5",
        "earn" : 10000,
        "parent_company_id" : null
    },
    {
        "_id" : 6,
        "name" : "Company6",
        "earn" : 15000,
        "parent_company_id" : 5
    },
    {
        "_id" : 7,
        "name" : "Company7",
        "earn" : 5000,
        "parent_company_id" : 5
    },
]

// module.exports = { 
//     companies,
//     companiesMDB
// };
