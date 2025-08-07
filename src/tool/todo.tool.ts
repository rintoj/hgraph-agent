import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { z } from 'zod'
import { createTool } from './builder.tool.js'

// In-memory todo storage
const todoLists = new Map<string, Array<{
  id: string
  text: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  createdAt: number
  completedAt?: number
  dependsOn?: string[]
  description?: string
}>>()

// Generate unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

export const createTodoList = createTool({
  description: 'Creates a new todo list or clears an existing one',
  parameters: z.object({
    listName: z.string().default('default').describe('Name of the todo list'),
    clear: z.boolean().default(false).describe('Clear existing list if it exists'),
  }),
  run: async ({ listName, clear }) => {
    try {
      if (todoLists.has(listName) && !clear) {
        return JSON.stringify({
          success: false,
          message: `Todo list '${listName}' already exists. Use clear=true to reset it.`,
          listName,
          itemCount: todoLists.get(listName)?.length || 0
        }, null, 2)
      }

      todoLists.set(listName, [])
      
      return JSON.stringify({
        success: true,
        message: `Todo list '${listName}' created successfully`,
        listName,
        itemCount: 0
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create todo list: ${error.message}`)
      }
      throw error
    }
  },
})

export const addTodo = createTool({
  description: 'Adds a new todo item to a list',
  parameters: z.object({
    listName: z.string().default('default').describe('Name of the todo list'),
    text: z.string().describe('Todo item text'),
    priority: z.enum(['low', 'medium', 'high']).default('medium').describe('Priority level'),
    dependsOn: z.array(z.string()).optional().describe('IDs of tasks this task depends on'),
    description: z.string().optional().describe('Detailed description of the task'),
  }),
  run: async ({ listName, text, priority, dependsOn, description }) => {
    try {
      if (!todoLists.has(listName)) {
        todoLists.set(listName, [])
      }

      const list = todoLists.get(listName)!
      const todo = {
        id: generateId(),
        text,
        completed: false,
        priority,
        createdAt: Date.now(),
        dependsOn,
        description
      }

      list.push(todo)

      return JSON.stringify({
        success: true,
        message: 'Todo item added successfully',
        listName,
        todo: {
          ...todo,
          createdAt: new Date(todo.createdAt).toISOString()
        },
        totalItems: list.length
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to add todo: ${error.message}`)
      }
      throw error
    }
  },
})

export const completeTodo = createTool({
  description: 'Marks a todo item as completed',
  parameters: z.object({
    listName: z.string().default('default').describe('Name of the todo list'),
    todoId: z.string().optional().describe('ID of the todo item'),
    todoIndex: z.number().optional().describe('Index of the todo item (0-based)'),
    todoText: z.string().optional().describe('Text to match (partial match)'),
  }),
  run: async ({ listName, todoId, todoIndex, todoText }) => {
    try {
      if (!todoLists.has(listName)) {
        return JSON.stringify({
          success: false,
          message: `Todo list '${listName}' not found`
        }, null, 2)
      }

      const list = todoLists.get(listName)!
      let todo

      if (todoId) {
        todo = list.find(t => t.id === todoId)
      } else if (todoIndex !== undefined) {
        todo = list[todoIndex]
      } else if (todoText) {
        todo = list.find(t => t.text.toLowerCase().includes(todoText.toLowerCase()))
      }

      if (!todo) {
        return JSON.stringify({
          success: false,
          message: 'Todo item not found'
        }, null, 2)
      }

      if (todo.completed) {
        return JSON.stringify({
          success: false,
          message: 'Todo item is already completed',
          todo: {
            id: todo.id,
            text: todo.text,
            completedAt: todo.completedAt ? new Date(todo.completedAt).toISOString() : undefined
          }
        }, null, 2)
      }

      todo.completed = true
      todo.completedAt = Date.now()

      return JSON.stringify({
        success: true,
        message: 'Todo item marked as completed',
        listName,
        todo: {
          ...todo,
          createdAt: new Date(todo.createdAt).toISOString(),
          completedAt: new Date(todo.completedAt).toISOString()
        }
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to complete todo: ${error.message}`)
      }
      throw error
    }
  },
})

export const uncompleteTodo = createTool({
  description: 'Marks a completed todo item as incomplete',
  parameters: z.object({
    listName: z.string().default('default').describe('Name of the todo list'),
    todoId: z.string().optional().describe('ID of the todo item'),
    todoIndex: z.number().optional().describe('Index of the todo item (0-based)'),
    todoText: z.string().optional().describe('Text to match (partial match)'),
  }),
  run: async ({ listName, todoId, todoIndex, todoText }) => {
    try {
      if (!todoLists.has(listName)) {
        return JSON.stringify({
          success: false,
          message: `Todo list '${listName}' not found`
        }, null, 2)
      }

      const list = todoLists.get(listName)!
      let todo

      if (todoId) {
        todo = list.find(t => t.id === todoId)
      } else if (todoIndex !== undefined) {
        todo = list[todoIndex]
      } else if (todoText) {
        todo = list.find(t => t.text.toLowerCase().includes(todoText.toLowerCase()))
      }

      if (!todo) {
        return JSON.stringify({
          success: false,
          message: 'Todo item not found'
        }, null, 2)
      }

      if (!todo.completed) {
        return JSON.stringify({
          success: false,
          message: 'Todo item is not completed',
          todo: {
            id: todo.id,
            text: todo.text
          }
        }, null, 2)
      }

      todo.completed = false
      delete todo.completedAt

      return JSON.stringify({
        success: true,
        message: 'Todo item marked as incomplete',
        listName,
        todo: {
          ...todo,
          createdAt: new Date(todo.createdAt).toISOString()
        }
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to uncomplete todo: ${error.message}`)
      }
      throw error
    }
  },
})

export const deleteTodo = createTool({
  description: 'Deletes a todo item from a list',
  parameters: z.object({
    listName: z.string().default('default').describe('Name of the todo list'),
    todoId: z.string().optional().describe('ID of the todo item'),
    todoIndex: z.number().optional().describe('Index of the todo item (0-based)'),
    todoText: z.string().optional().describe('Text to match (partial match)'),
  }),
  run: async ({ listName, todoId, todoIndex, todoText }) => {
    try {
      if (!todoLists.has(listName)) {
        return JSON.stringify({
          success: false,
          message: `Todo list '${listName}' not found`
        }, null, 2)
      }

      const list = todoLists.get(listName)!
      let index = -1

      if (todoId) {
        index = list.findIndex(t => t.id === todoId)
      } else if (todoIndex !== undefined) {
        index = todoIndex
      } else if (todoText) {
        index = list.findIndex(t => t.text.toLowerCase().includes(todoText.toLowerCase()))
      }

      if (index === -1 || index >= list.length) {
        return JSON.stringify({
          success: false,
          message: 'Todo item not found'
        }, null, 2)
      }

      const [deleted] = list.splice(index, 1)

      return JSON.stringify({
        success: true,
        message: 'Todo item deleted successfully',
        listName,
        deletedTodo: {
          ...deleted,
          createdAt: new Date(deleted.createdAt).toISOString(),
          completedAt: deleted.completedAt ? new Date(deleted.completedAt).toISOString() : undefined
        },
        remainingItems: list.length
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete todo: ${error.message}`)
      }
      throw error
    }
  },
})

export const listTodos = createTool({
  description: 'Lists all todo items with optional filtering',
  parameters: z.object({
    listName: z.string().default('default').describe('Name of the todo list'),
    filter: z.enum(['all', 'completed', 'incomplete', 'blocked']).default('all').describe('Filter todos'),
    priority: z.enum(['low', 'medium', 'high']).optional().describe('Filter by priority'),
    sortBy: z.enum(['created', 'priority', 'text']).default('created').describe('Sort field'),
    ascending: z.boolean().default(true).describe('Sort order'),
  }),
  run: async ({ listName, filter, priority, sortBy, ascending }) => {
    try {
      if (!todoLists.has(listName)) {
        return JSON.stringify({
          success: true,
          message: `Todo list '${listName}' is empty`,
          listName,
          todos: [],
          stats: {
            total: 0,
            completed: 0,
            incomplete: 0,
            blocked: 0
          }
        }, null, 2)
      }

      const list = todoLists.get(listName)!
      const now = Date.now()
      
      let filtered = [...list]

      // Apply filters
      if (filter === 'completed') {
        filtered = filtered.filter(t => t.completed)
      } else if (filter === 'incomplete') {
        filtered = filtered.filter(t => !t.completed)
      } else if (filter === 'blocked') {
        // Filter tasks that are blocked by incomplete dependencies
        filtered = filtered.filter(t => {
          if (!t.dependsOn || t.dependsOn.length === 0) return false
          return t.dependsOn.some(depId => {
            const dep = list.find(task => task.id === depId)
            return dep && !dep.completed
          })
        })
      }

      if (priority) {
        filtered = filtered.filter(t => t.priority === priority)
      }

      // Sort
      filtered.sort((a, b) => {
        let comparison = 0
        
        switch (sortBy) {
          case 'created':
            comparison = a.createdAt - b.createdAt
            break
          case 'priority':
            const priorityOrder = { high: 0, medium: 1, low: 2 }
            comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
            break
          case 'text':
            comparison = a.text.localeCompare(b.text)
            break
        }
        
        return ascending ? comparison : -comparison
      })

      // Calculate stats
      const stats = {
        total: list.length,
        completed: list.filter(t => t.completed).length,
        incomplete: list.filter(t => !t.completed).length,
        blocked: list.filter(t => {
          if (!t.dependsOn || t.dependsOn.length === 0) return false
          return t.dependsOn.some(depId => {
            const dep = list.find(task => task.id === depId)
            return dep && !dep.completed
          })
        }).length
      }

      // Format todos for output
      const formattedTodos = filtered.map((todo, index) => ({
        index,
        ...todo,
        createdAt: new Date(todo.createdAt).toISOString(),
        completedAt: todo.completedAt ? new Date(todo.completedAt).toISOString() : undefined,
        isBlocked: todo.dependsOn && todo.dependsOn.length > 0 && todo.dependsOn.some(depId => {
          const dep = list.find(task => task.id === depId)
          return dep && !dep.completed
        })
      }))

      return JSON.stringify({
        success: true,
        listName,
        filter,
        todos: formattedTodos,
        stats
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list todos: ${error.message}`)
      }
      throw error
    }
  },
})

export const updateTodo = createTool({
  description: 'Updates an existing todo item',
  parameters: z.object({
    listName: z.string().default('default').describe('Name of the todo list'),
    todoId: z.string().optional().describe('ID of the todo item'),
    todoIndex: z.number().optional().describe('Index of the todo item (0-based)'),
    todoText: z.string().optional().describe('Text to match (partial match)'),
    updates: z.object({
      text: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      dependsOn: z.array(z.string()).optional(),
      description: z.string().optional(),
    }).describe('Fields to update'),
  }),
  run: async ({ listName, todoId, todoIndex, todoText, updates }) => {
    try {
      if (!todoLists.has(listName)) {
        return JSON.stringify({
          success: false,
          message: `Todo list '${listName}' not found`
        }, null, 2)
      }

      const list = todoLists.get(listName)!
      let todo

      if (todoId) {
        todo = list.find(t => t.id === todoId)
      } else if (todoIndex !== undefined) {
        todo = list[todoIndex]
      } else if (todoText) {
        todo = list.find(t => t.text.toLowerCase().includes(todoText.toLowerCase()))
      }

      if (!todo) {
        return JSON.stringify({
          success: false,
          message: 'Todo item not found'
        }, null, 2)
      }

      // Apply updates
      if (updates.text !== undefined) todo.text = updates.text
      if (updates.priority !== undefined) todo.priority = updates.priority
      if (updates.dependsOn !== undefined) todo.dependsOn = updates.dependsOn
      if (updates.description !== undefined) todo.description = updates.description

      return JSON.stringify({
        success: true,
        message: 'Todo item updated successfully',
        listName,
        todo: {
          ...todo,
          createdAt: new Date(todo.createdAt).toISOString(),
          completedAt: todo.completedAt ? new Date(todo.completedAt).toISOString() : undefined
        }
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update todo: ${error.message}`)
      }
      throw error
    }
  },
})

export const getTodoStats = createTool({
  description: 'Gets statistics for a todo list',
  parameters: z.object({
    listName: z.string().default('default').describe('Name of the todo list'),
    detailed: z.boolean().default(false).describe('Include detailed breakdown'),
  }),
  run: async ({ listName, detailed }) => {
    try {
      if (!todoLists.has(listName)) {
        return JSON.stringify({
          success: true,
          listName,
          stats: {
            total: 0,
            completed: 0,
            incomplete: 0,
            blocked: 0,
            completionRate: '0%'
          }
        }, null, 2)
      }

      const list = todoLists.get(listName)!
      const now = Date.now()

      const stats: any = {
        total: list.length,
        completed: list.filter(t => t.completed).length,
        incomplete: list.filter(t => !t.completed).length,
        blocked: list.filter(t => {
          if (!t.dependsOn || t.dependsOn.length === 0) return false
          return t.dependsOn.some(depId => {
            const dep = list.find(task => task.id === depId)
            return dep && !dep.completed
          })
        }).length,
      }

      stats.completionRate = stats.total > 0 
        ? `${((stats.completed / stats.total) * 100).toFixed(1)}%`
        : '0%'

      if (detailed) {
        // Priority breakdown
        stats.byPriority = {
          high: {
            total: list.filter(t => t.priority === 'high').length,
            completed: list.filter(t => t.priority === 'high' && t.completed).length,
            incomplete: list.filter(t => t.priority === 'high' && !t.completed).length,
          },
          medium: {
            total: list.filter(t => t.priority === 'medium').length,
            completed: list.filter(t => t.priority === 'medium' && t.completed).length,
            incomplete: list.filter(t => t.priority === 'medium' && !t.completed).length,
          },
          low: {
            total: list.filter(t => t.priority === 'low').length,
            completed: list.filter(t => t.priority === 'low' && t.completed).length,
            incomplete: list.filter(t => t.priority === 'low' && !t.completed).length,
          },
        }

        // Dependency breakdown
        const blockedTasks = list.filter(t => {
          if (!t.dependsOn || t.dependsOn.length === 0) return false
          return t.dependsOn.some(depId => {
            const dep = list.find(task => task.id === depId)
            return dep && !dep.completed
          })
        })
        
        stats.dependencies = {
          tasksWithDependencies: list.filter(t => t.dependsOn && t.dependsOn.length > 0).length,
          blockedTasks: blockedTasks.length,
          readyTasks: list.filter(t => 
            !t.completed && (!t.dependsOn || t.dependsOn.length === 0 || 
            t.dependsOn.every(depId => {
              const dep = list.find(task => task.id === depId)
              return !dep || dep.completed
            }))
          ).length
        }

        // Time statistics
        const completedTodos = list.filter(t => t.completed && t.completedAt)
        if (completedTodos.length > 0) {
          const completionTimes = completedTodos.map(t => (t.completedAt! - t.createdAt) / 1000 / 60 / 60) // in hours
          stats.averageCompletionTime = `${(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length).toFixed(1)} hours`
        }
      }

      return JSON.stringify({
        success: true,
        listName,
        stats
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get todo stats: ${error.message}`)
      }
      throw error
    }
  },
})

export const clearCompletedTodos = createTool({
  description: 'Removes all completed todos from a list',
  parameters: z.object({
    listName: z.string().default('default').describe('Name of the todo list'),
  }),
  run: async ({ listName }) => {
    try {
      if (!todoLists.has(listName)) {
        return JSON.stringify({
          success: false,
          message: `Todo list '${listName}' not found`
        }, null, 2)
      }

      const list = todoLists.get(listName)!
      const completedCount = list.filter(t => t.completed).length
      const remaining = list.filter(t => !t.completed)
      
      todoLists.set(listName, remaining)

      return JSON.stringify({
        success: true,
        message: `Cleared ${completedCount} completed todos`,
        listName,
        removedCount: completedCount,
        remainingCount: remaining.length
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to clear completed todos: ${error.message}`)
      }
      throw error
    }
  },
})

export const saveTodoList = createTool({
  description: 'Saves a todo list to a JSON file',
  parameters: z.object({
    listName: z.string().default('default').describe('Name of the todo list'),
    filePath: z.string().describe('Path to save the file'),
  }),
  run: async ({ listName, filePath }) => {
    try {
      if (!todoLists.has(listName)) {
        return JSON.stringify({
          success: false,
          message: `Todo list '${listName}' not found`
        }, null, 2)
      }

      const list = todoLists.get(listName)!
      
      // Create directory if needed
      await fs.mkdir(dirname(filePath), { recursive: true })
      
      // Format todos for saving
      const data = {
        listName,
        savedAt: new Date().toISOString(),
        todos: list.map(todo => ({
          ...todo,
          createdAt: new Date(todo.createdAt).toISOString(),
          completedAt: todo.completedAt ? new Date(todo.completedAt).toISOString() : undefined
        }))
      }

      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')

      return JSON.stringify({
        success: true,
        message: 'Todo list saved successfully',
        listName,
        filePath,
        todoCount: list.length
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to save todo list: ${error.message}`)
      }
      throw error
    }
  },
})

export const loadTodoList = createTool({
  description: 'Loads a todo list from a JSON file',
  parameters: z.object({
    filePath: z.string().describe('Path to the saved file'),
    listName: z.string().optional().describe('Override the list name from file'),
    merge: z.boolean().default(false).describe('Merge with existing list instead of replacing'),
  }),
  run: async ({ filePath, listName, merge }) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const data = JSON.parse(content)
      
      const targetListName = listName || data.listName || 'default'
      
      // Parse todos
      const loadedTodos = data.todos.map((todo: any) => ({
        ...todo,
        createdAt: new Date(todo.createdAt).getTime(),
        completedAt: todo.completedAt ? new Date(todo.completedAt).getTime() : undefined,
      }))

      if (merge && todoLists.has(targetListName)) {
        const existingList = todoLists.get(targetListName)!
        existingList.push(...loadedTodos)
      } else {
        todoLists.set(targetListName, loadedTodos)
      }

      return JSON.stringify({
        success: true,
        message: `Todo list loaded successfully`,
        listName: targetListName,
        loadedCount: loadedTodos.length,
        totalCount: todoLists.get(targetListName)!.length,
        merged: merge
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load todo list: ${error.message}`)
      }
      throw error
    }
  },
})

export const listAllTodoLists = createTool({
  description: 'Lists all available todo lists with their statistics',
  parameters: z.object({}),
  run: async () => {
    try {
      const lists: any[] = []
      const now = Date.now()

      for (const [name, todos] of todoLists.entries()) {
        lists.push({
          name,
          stats: {
            total: todos.length,
            completed: todos.filter(t => t.completed).length,
            incomplete: todos.filter(t => !t.completed).length,
            blocked: todos.filter(t => {
              if (!t.dependsOn || t.dependsOn.length === 0) return false
              return t.dependsOn.some(depId => {
                const dep = todos.find(task => task.id === depId)
                return dep && !dep.completed
              })
            }).length,
            highPriority: todos.filter(t => t.priority === 'high' && !t.completed).length,
          }
        })
      }

      return JSON.stringify({
        success: true,
        totalLists: lists.length,
        lists
      }, null, 2)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list todo lists: ${error.message}`)
      }
      throw error
    }
  },
})