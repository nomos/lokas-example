let Dice={

    _seed:133,
    genSeed:function () {
        this._seed++;
        return this._seed;
        // return Math.random()*1000;
    },
    random:function (seed) {
        if (!seed) {
            return Math.random();
            seed=this.genSeed();
        }
        seed=(seed+1573)*(seed+125513)+seed*9301+149297;
        seed=Math.pow(seed*(seed+23623), 13)%233783;
        return seed/233783;
    },
    rngInt:function (val1, val2, seed) {
        return parseInt(this.rng(val1, val2+1, seed));
    },
    rng:function (val1, val2, seed) {
        let minVal=val1<val2 ? val1:val2;
        let maxVal=val1<val2 ? val2:val1;
        return minVal+(maxVal-minVal)*this.random(seed);
    },

    porn:function (seed) {
        return this.one_in(2,seed)?-1:1;
    },

    one_in:function (chance, seed) {
        return (chance<=1||this.rng(0, chance, seed)<1);
    },
    x_in_y(x, y, seed) {
        return this.random(seed)<x/y;
    },
    weight_select:function (weightList, seed) {
        let sum=0;
        for (let i=0; i<weightList.length; i++) {
            sum+=weightList[i];
        }
        let rand=this.random(seed)*sum;
        for (i=0; i<weightList.length; i++) {
            let weight=weightList[i];
            if (weight>rand) {
                break;
            } else {
                rand-=weight;
            }
        }
        return i;
    },
    shuffle:function (arr,seed) {

        if (!Array.isArray(arr)) {
            throw new Error('shuffle expect an array as parameter.');
        }
        let collection=arr;
        let len=arr.length;
        let random;
        let temp;

        while (len) {
            seed = seed?seed+1:seed;
            random=Math.floor(this.random(seed)*len);
            len-=1;
            temp=collection[len];
            collection[len]=collection[random];
            collection[random]=temp;
        }

        return collection;
    },

    pick:function (arr, options) {
        if (!Array.isArray(arr)) {
            throw new Error('shuffle.pick() expect an array as parameter.');
        }

        options=options||{};
        let rng=options.rng||Math.random;
        let picks=options.picks||1;

        if (typeof picks==='number'&&picks!==1) {
            let len=arr.length,
                collection=arr.slice(),
                random=[],
                index;

            while (picks&&len) {
                index=Math.floor(rng()*len);
                random.push(collection[index]);
                collection.splice(index, 1);
                len-=1;
                picks-=1;
            }
            return random;
        }
        let index = Math.floor(rng()*arr.length);
        let ret = arr[index];
        arr.splice(index,1);
        return ret;
    }
};

module.exports=Dice;