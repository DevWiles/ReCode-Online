/**
 * Demo mode (DEMO_MODE=1) runs a separate public instance where every visitor
 * gets a throwaway sandbox account preloaded with sample questions. It never
 * shares a database with the real site.
 */

import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/db";

export const isDemoMode = process.env.DEMO_MODE === "1";

export const DEMO_UPSTREAM_URL = "https://github.com/CoisiniIce/ReCode";

// Sandbox accounts are named demo-xxxxxx; nobody else can pick that prefix
// because registration is closed on the demo instance
const DEMO_PREFIX = "demo-";
// How long a sandbox lives before the next visitor's sign-in sweeps it away
export const DEMO_TTL_HOURS = 6;
// New sandboxes one IP may open per hour
const MAX_SANDBOXES_PER_HOUR = 20;

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY);

type SeedSolution = { label: string; language: string; code: string };

type SeedProblem = {
  pid: string;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  // Self-rated mastery 0-5 and where the problem sits in the review schedule
  mastery: number;
  // Days until the next review; 0 or less means it is due today
  dueIn: number;
  reviewCount: number;
  // When the question was first recorded, days ago
  addedDaysAgo: number;
  solutions: SeedSolution[];
};

const DIFFICULTY_LEVEL = { Easy: 1, Medium: 2, Hard: 3 } as const;
const INITIAL_EASINESS = { Easy: 2.6, Medium: 2.5, Hard: 2.4 } as const;

const SEED: SeedProblem[] = [
  {
    pid: "1",
    title: "两数之和",
    slug: "two-sum",
    difficulty: "Easy",
    tags: ["数组", "哈希表"],
    mastery: 5,
    dueIn: 20,
    reviewCount: 6,
    addedDaysAgo: 29,
    solutions: [
      {
        label: "哈希表一次遍历",
        language: "python",
        code: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}  # 值 -> 下标
        for i, x in enumerate(nums):
            if target - x in seen:
                return [seen[target - x], i]
            seen[x] = i
        return []`,
      },
      {
        label: "暴力枚举",
        language: "python",
        code: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        n = len(nums)
        for i in range(n):
            for j in range(i + 1, n):
                if nums[i] + nums[j] == target:
                    return [i, j]
        return []`,
      },
    ],
  },
  {
    pid: "3",
    title: "无重复字符的最长子串",
    slug: "longest-substring-without-repeating-characters",
    difficulty: "Medium",
    tags: ["哈希表", "字符串", "滑动窗口"],
    mastery: 3,
    dueIn: 0,
    reviewCount: 3,
    addedDaysAgo: 24,
    solutions: [
      {
        label: "滑动窗口",
        language: "typescript",
        code: `function lengthOfLongestSubstring(s: string): number {
  const last = new Map<string, number>(); // 字符 -> 最近一次出现的位置
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    const prev = last.get(s[right]);
    if (prev !== undefined && prev >= left) left = prev + 1;
    last.set(s[right], right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
      },
    ],
  },
  {
    pid: "11",
    title: "盛最多水的容器",
    slug: "container-with-most-water",
    difficulty: "Medium",
    tags: ["贪心", "数组", "双指针"],
    mastery: 3,
    dueIn: 3,
    reviewCount: 3,
    addedDaysAgo: 22,
    solutions: [
      {
        label: "双指针",
        language: "java",
        code: `class Solution {
    public int maxArea(int[] height) {
        int i = 0, j = height.length - 1, best = 0;
        while (i < j) {
            best = Math.max(best, (j - i) * Math.min(height[i], height[j]));
            // 短板决定面积，只有移动短板才可能变大
            if (height[i] < height[j]) i++;
            else j--;
        }
        return best;
    }
}`,
      },
    ],
  },
  {
    pid: "15",
    title: "三数之和",
    slug: "3sum",
    difficulty: "Medium",
    tags: ["数组", "双指针", "排序"],
    mastery: 2,
    dueIn: -1,
    reviewCount: 2,
    addedDaysAgo: 20,
    solutions: [
      {
        label: "排序 + 双指针",
        language: "python",
        code: `class Solution:
    def threeSum(self, nums: list[int]) -> list[list[int]]:
        nums.sort()
        res = []
        for i in range(len(nums) - 2):
            if nums[i] > 0:
                break
            if i > 0 and nums[i] == nums[i - 1]:
                continue  # 跳过重复的第一个数
            l, r = i + 1, len(nums) - 1
            while l < r:
                s = nums[i] + nums[l] + nums[r]
                if s < 0:
                    l += 1
                elif s > 0:
                    r -= 1
                else:
                    res.append([nums[i], nums[l], nums[r]])
                    while l < r and nums[l] == nums[l + 1]:
                        l += 1
                    while l < r and nums[r] == nums[r - 1]:
                        r -= 1
                    l += 1
                    r -= 1
        return res`,
      },
    ],
  },
  {
    pid: "20",
    title: "有效的括号",
    slug: "valid-parentheses",
    difficulty: "Easy",
    tags: ["栈", "字符串"],
    mastery: 4,
    dueIn: 9,
    reviewCount: 4,
    addedDaysAgo: 27,
    solutions: [
      {
        label: "栈",
        language: "typescript",
        code: `function isValid(s: string): boolean {
  const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const stack: string[] = [];
  for (const ch of s) {
    if (ch in pairs) {
      if (stack.pop() !== pairs[ch]) return false;
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0;
}`,
      },
    ],
  },
  {
    pid: "21",
    title: "合并两个有序链表",
    slug: "merge-two-sorted-lists",
    difficulty: "Easy",
    tags: ["递归", "链表"],
    mastery: 4,
    dueIn: 0,
    reviewCount: 4,
    addedDaysAgo: 26,
    solutions: [
      {
        label: "哨兵节点迭代",
        language: "java",
        code: `class Solution {
    public ListNode mergeTwoLists(ListNode a, ListNode b) {
        ListNode dummy = new ListNode(0), tail = dummy;
        while (a != null && b != null) {
            if (a.val <= b.val) { tail.next = a; a = a.next; }
            else { tail.next = b; b = b.next; }
            tail = tail.next;
        }
        tail.next = (a != null) ? a : b;
        return dummy.next;
    }
}`,
      },
      {
        label: "递归",
        language: "java",
        code: `class Solution {
    public ListNode mergeTwoLists(ListNode a, ListNode b) {
        if (a == null) return b;
        if (b == null) return a;
        if (a.val <= b.val) {
            a.next = mergeTwoLists(a.next, b);
            return a;
        }
        b.next = mergeTwoLists(a, b.next);
        return b;
    }
}`,
      },
    ],
  },
  {
    pid: "23",
    title: "合并 K 个升序链表",
    slug: "merge-k-sorted-lists",
    difficulty: "Hard",
    tags: ["链表", "分治", "堆（优先队列）"],
    mastery: 2,
    dueIn: 2,
    reviewCount: 2,
    addedDaysAgo: 12,
    solutions: [
      {
        label: "最小堆",
        language: "python",
        code: `import heapq

class Solution:
    def mergeKLists(self, lists: list[Optional[ListNode]]) -> Optional[ListNode]:
        # 下标 i 作为第二关键字，避免值相同时去比较 ListNode
        heap = [(node.val, i, node) for i, node in enumerate(lists) if node]
        heapq.heapify(heap)
        dummy = tail = ListNode(0)
        while heap:
            _, i, node = heapq.heappop(heap)
            tail.next = tail = node
            if node.next:
                heapq.heappush(heap, (node.next.val, i, node.next))
        return dummy.next`,
      },
    ],
  },
  {
    pid: "33",
    title: "搜索旋转排序数组",
    slug: "search-in-rotated-sorted-array",
    difficulty: "Medium",
    tags: ["数组", "二分查找"],
    mastery: 3,
    dueIn: 4,
    reviewCount: 3,
    addedDaysAgo: 15,
    solutions: [
      {
        label: "二分：先判断哪一半有序",
        language: "typescript",
        code: `function search(nums: number[], target: number): number {
  let lo = 0;
  let hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) {
      // 左半段有序
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {
      // 右半段有序
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}`,
      },
    ],
  },
  {
    pid: "42",
    title: "接雨水",
    slug: "trapping-rain-water",
    difficulty: "Hard",
    tags: ["栈", "数组", "双指针", "动态规划", "单调栈"],
    mastery: 0,
    dueIn: 0,
    reviewCount: 1,
    addedDaysAgo: 3,
    solutions: [
      {
        label: "双指针",
        language: "java",
        code: `class Solution {
    public int trap(int[] height) {
        int l = 0, r = height.length - 1;
        int leftMax = 0, rightMax = 0, water = 0;
        while (l < r) {
            leftMax = Math.max(leftMax, height[l]);
            rightMax = Math.max(rightMax, height[r]);
            // 哪边的最高墙更矮，哪边的水位就已经确定
            if (leftMax < rightMax) water += leftMax - height[l++];
            else water += rightMax - height[r--];
        }
        return water;
    }
}`,
      },
      {
        label: "单调栈",
        language: "typescript",
        code: `function trap(height: number[]): number {
  const stack: number[] = []; // 存下标，对应高度单调递减
  let water = 0;
  for (let i = 0; i < height.length; i++) {
    while (stack.length && height[i] > height[stack[stack.length - 1]]) {
      const bottom = stack.pop()!;
      if (!stack.length) break;
      const left = stack[stack.length - 1];
      const h = Math.min(height[left], height[i]) - height[bottom];
      water += h * (i - left - 1);
    }
    stack.push(i);
  }
  return water;
}`,
      },
    ],
  },
  {
    pid: "70",
    title: "爬楼梯",
    slug: "climbing-stairs",
    difficulty: "Easy",
    tags: ["记忆化搜索", "数学", "动态规划"],
    mastery: 5,
    dueIn: 15,
    reviewCount: 5,
    addedDaysAgo: 28,
    solutions: [
      {
        label: "滚动数组 DP",
        language: "python",
        code: `class Solution:
    def climbStairs(self, n: int) -> int:
        a, b = 1, 1  # f(0), f(1)
        for _ in range(n - 1):
            a, b = b, a + b
        return b`,
      },
    ],
  },
  {
    pid: "102",
    title: "二叉树的层序遍历",
    slug: "binary-tree-level-order-traversal",
    difficulty: "Medium",
    tags: ["树", "广度优先搜索", "二叉树"],
    mastery: 4,
    dueIn: 6,
    reviewCount: 4,
    addedDaysAgo: 18,
    solutions: [
      {
        label: "BFS 按层出队",
        language: "python",
        code: `from collections import deque

class Solution:
    def levelOrder(self, root: Optional[TreeNode]) -> list[list[int]]:
        if not root:
            return []
        res, q = [], deque([root])
        while q:
            level = []
            for _ in range(len(q)):  # 当前队列里恰好是一整层
                node = q.popleft()
                level.append(node.val)
                if node.left:
                    q.append(node.left)
                if node.right:
                    q.append(node.right)
            res.append(level)
        return res`,
      },
    ],
  },
  {
    pid: "146",
    title: "LRU 缓存",
    slug: "lru-cache",
    difficulty: "Medium",
    tags: ["设计", "哈希表", "链表", "双向链表"],
    mastery: 1,
    dueIn: 0,
    reviewCount: 2,
    addedDaysAgo: 9,
    solutions: [
      {
        label: "Map 保持插入顺序",
        language: "typescript",
        code: `class LRUCache {
  private cache = new Map<number, number>();

  constructor(private capacity: number) {}

  get(key: number): number {
    if (!this.cache.has(key)) return -1;
    const value = this.cache.get(key)!;
    // 删了再插，挪到「最近使用」的末尾
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key: number, value: number): void {
    this.cache.delete(key);
    this.cache.set(key, value);
    if (this.cache.size > this.capacity) {
      // Map 的第一个键就是最久未使用的
      this.cache.delete(this.cache.keys().next().value!);
    }
  }
}`,
      },
    ],
  },
  {
    pid: "200",
    title: "岛屿数量",
    slug: "number-of-islands",
    difficulty: "Medium",
    tags: ["深度优先搜索", "广度优先搜索", "并查集", "矩阵"],
    mastery: 2,
    dueIn: 1,
    reviewCount: 2,
    addedDaysAgo: 10,
    solutions: [
      {
        label: "DFS 淹没岛屿",
        language: "python",
        code: `class Solution:
    def numIslands(self, grid: list[list[str]]) -> int:
        m, n = len(grid), len(grid[0])

        def sink(i: int, j: int) -> None:
            if not (0 <= i < m and 0 <= j < n) or grid[i][j] != "1":
                return
            grid[i][j] = "0"
            for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                sink(i + di, j + dj)

        count = 0
        for i in range(m):
            for j in range(n):
                if grid[i][j] == "1":
                    count += 1
                    sink(i, j)
        return count`,
      },
      {
        label: "并查集",
        language: "python",
        code: `class Solution:
    def numIslands(self, grid: list[list[str]]) -> int:
        m, n = len(grid), len(grid[0])
        parent = list(range(m * n))
        count = sum(row.count("1") for row in grid)

        def find(x: int) -> int:
            while parent[x] != x:
                parent[x] = parent[parent[x]]  # 路径压缩
                x = parent[x]
            return x

        for i in range(m):
            for j in range(n):
                if grid[i][j] != "1":
                    continue
                for ni, nj in ((i + 1, j), (i, j + 1)):
                    if ni < m and nj < n and grid[ni][nj] == "1":
                        a, b = find(i * n + j), find(ni * n + nj)
                        if a != b:
                            parent[a] = b
                            count -= 1
        return count`,
      },
    ],
  },
  {
    pid: "300",
    title: "最长递增子序列",
    slug: "longest-increasing-subsequence",
    difficulty: "Medium",
    tags: ["数组", "二分查找", "动态规划"],
    mastery: 1,
    dueIn: -2,
    reviewCount: 2,
    addedDaysAgo: 7,
    solutions: [
      {
        label: "贪心 + 二分 O(n log n)",
        language: "python",
        code: `from bisect import bisect_left

class Solution:
    def lengthOfLIS(self, nums: list[int]) -> int:
        tails = []  # tails[k]：长度为 k+1 的递增子序列的最小结尾
        for x in nums:
            k = bisect_left(tails, x)
            if k == len(tails):
                tails.append(x)
            else:
                tails[k] = x
        return len(tails)`,
      },
      {
        label: "DP O(n²)",
        language: "python",
        code: `class Solution:
    def lengthOfLIS(self, nums: list[int]) -> int:
        dp = [1] * len(nums)  # dp[i]：以 nums[i] 结尾的 LIS 长度
        for i in range(len(nums)):
            for j in range(i):
                if nums[j] < nums[i]:
                    dp[i] = max(dp[i], dp[j] + 1)
        return max(dp)`,
      },
    ],
  },
];

/**
 * Removes sandboxes older than DEMO_TTL_HOURS, and demo login records older
 * than a week. Runs whenever someone opens a new sandbox, so no timer is needed.
 */
const sweepExpiredSandboxes = async () => {
  const cutoff = new Date(Date.now() - DEMO_TTL_HOURS * 60 * 60 * 1000);

  const expired = await prisma.user.findMany({
    where: { username: { startsWith: DEMO_PREFIX }, createdAt: { lt: cutoff } },
    select: { id: true },
  });
  const ids = expired.map((user) => user.id);

  if (ids.length > 0) {
    await prisma.$transaction([
      prisma.submission.deleteMany({ where: { progress: { userId: { in: ids } } } }),
      prisma.progress.deleteMany({ where: { userId: { in: ids } } }),
      prisma.problem.deleteMany({ where: { userId: { in: ids } } }),
      prisma.user.deleteMany({ where: { id: { in: ids } } }),
    ]);
  }

  await prisma.loginLog.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 7 * DAY) } },
  });
};

/** Sandboxes this IP opened in the last hour. */
export const recentSandboxCount = (ip: string) =>
  prisma.loginLog.count({
    where: {
      ip,
      reason: "DEMO_SANDBOX",
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });

export const SANDBOX_LIMIT_PER_HOUR = MAX_SANDBOXES_PER_HOUR;

/** Creates a fresh sandbox account filled with the sample questions. */
export const createSandbox = async () => {
  await sweepExpiredSandboxes();

  const username = `${DEMO_PREFIX}${randomBytes(4).toString("hex")}`;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username,
        // No password: the account can only be entered through its own cookie
        passwordHash: null,
        // The app requires a verified email; a sandbox has none to verify
        emailVerifiedAt: new Date(),
        uiLanguage: "zh",
        preferredLang: "python",
      },
    });

    for (const seed of SEED) {
      const problem = await tx.problem.create({
        data: {
          userId: user.id,
          platform: "LEETCODE",
          pid: seed.pid,
          title: seed.title,
          slug: seed.slug,
          url: `https://leetcode.cn/problems/${seed.slug}/`,
          difficulty: seed.difficulty,
          difficultyLevel: DIFFICULTY_LEVEL[seed.difficulty],
          tags: seed.tags.join(","),
        },
      });

      const interval = Math.max(1, seed.dueIn + 2 * seed.reviewCount);
      const progress = await tx.progress.create({
        data: {
          userId: user.id,
          problemId: problem.id,
          status: seed.mastery === 5 ? "Solved" : "Reviewing",
          masteryLevel: seed.mastery,
          interval,
          easiness: INITIAL_EASINESS[seed.difficulty],
          reviewCount: seed.reviewCount,
          lastReview: daysFromNow(Math.min(-1, seed.dueIn - interval)),
          nextReview: daysFromNow(seed.dueIn),
          createdAt: daysFromNow(-seed.addedDaysAgo),
        },
      });

      for (const [index, solution] of seed.solutions.entries()) {
        await tx.submission.create({
          data: {
            progressId: progress.id,
            label: solution.label,
            language: solution.language,
            code: solution.code,
            sortOrder: index,
            isMain: index === 0,
          },
        });
      }
    }

    return user;
  });
};
