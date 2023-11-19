import json
import random
from tqdm import tqdm
from datetime import datetime, timedelta, timezone

# タイムゾーンの生成
JST = timezone(timedelta(hours=+9), 'JST')

### base
############################################################
def main():
    json_dict = {}
    start_date = datetime(2023, 11, 1)
    end_date = datetime(2024, 3, 31)
    days_num = (end_date - start_date).days + 1
    for i in tqdm(range(days_num)):
        date = start_date + timedelta(days=i)
        data = sub_1day(date)
        json_dict[date.strftime('%Y.%m.%d')] = data

    with open('data.json', 'w', encoding='utf8') as f:
        json.dump(json_dict, f, ensure_ascii=False)


def sub_1day(date):

    # table内容
    table4, answers4 = get_table(4, date)
    table5, answers5 = get_table(5, date)

    def shorten(table):
        return [''.join(row) for row in table]

    data = {
        'normal': {
            'question': shorten(table4),
            'answer': answers4,
        },
        'hard': {
            'question': shorten(table5),
            'answer': answers5,
        }
    }

    return data


def get_table(size: int, date):
    nums = list(map(str, range(1,10)))
    ops = list('＋－×÷')

    # 日ごとの運勢のため、日付8桁表記を乱数のシードとする
    seed = date.strftime('%Y%m%d')
    random.seed(seed)

    table = None
    answers = get_answer(table)
    while True:
        table = [[None for _ in range(size)] for _ in range(size)]
        for i in range(size):
            for j in range(size):
                if (i+j) % 2 == 0:
                    table[i][j] = random.choice(nums)
                else:
                    table[i][j] = random.choice(ops)
        answers = get_answer(table)
        if {'diff1', 'diff2', 'diff3', 'diff4'} <= answers.keys():
            return table, answers['diff4']

    return


def get_answer(table, sum=10):
    if not table:
        return {}

    size = len(table)
    perms = get_permutations(size)

    ps = {}
    table_long = [c for row in table for c in row]
    for p in perms:
        diff = get_difficulty(size, len(p))
        if diff in ps:
            continue
        eq = ''.join([table_long[x] for x in p])
        if eval(zen2han(eq)) == sum:
            ps[diff] = p
    return ps


def get_permutations(size):
    ret = []

    def rec(arr):
        x = arr[-1]
        i, j = x//size, x%size
        if x == size**2-1:
            ret.append(arr)
            return True

        for di, dj in [(-1,0), (0,-1), (0, 1), (1, 0)]:
            ii, jj = i + di, j + dj
            xx = ii * size + jj
            if (ii < 0 or ii >= size) or (jj < 0 or jj >= size) or (xx in arr):
                continue
            rec([*arr, xx])

    rec([0])
    return ret


def get_difficulty(size, length):
    diff_thre = get_difficulty_threshold(size)
    if length <= diff_thre[0]:
        return 'diff1'
    elif length <= diff_thre[1]:
        return 'diff2'
    elif length <= diff_thre[2]:
        return 'diff3'
    else:
        return 'diff4'


def get_difficulty_threshold(size):
    if size == 5:
        return [11, 17, 23, 25]
    elif size == 4:
        return [7, 11, 13, 15]
    elif size == 3:
        return [5, 7, 9, 9]
    else:
        return [0, 0, 0, 0]


def zen2han(eq):
    return eq.replace('＋', '+').replace('－', '-').replace('×', '*').replace('÷', '/')


def _debug():

    table, answer = get_table(size=4)
    for row in table:
        print(*map(zen2han, row))
    for k, v in answer.items():
        print(k, v)


if __name__ == "__main__":
    main()
